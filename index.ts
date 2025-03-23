// Copyright 2024, Pulumi Corporation.  All rights reserved.
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as pulumiservice from "@pulumi/pulumiservice";
import * as tls from "@pulumi/tls";

// Configuration
const config = new pulumi.Config();
const escProject = config.require("escProject");
const escEnvName = config.require("escEnvironmentName");
const sessionDuration = config.get("sessionDuration") || "1h";
const roleName = config.get("roleName") || "pulumi-cloud-admin";
const policyArn = config.get("policyArn") || "arn:aws:iam::aws:policy/AdministratorAccess";

const pulumiOrg = pulumi.getOrganization();

// NOTE: At the time of writing, if you are still using the legacy "default"
// organization, the format for the audience OIDC claim is different. Best
// practice is to avoid using the legacy default project.
const oidcAudience = escProject === "default" ? pulumiOrg : `aws:${pulumiOrg}`;

const oidcIdpUrl = "https://api.pulumi.com/oidc";

// Get certificates for OIDC provider
const certs = tls.getCertificateOutput({
    url: oidcIdpUrl,
});

const thumbprint = certs.certificates[0].sha1Fingerprint;

// Create OIDC provider
const provider = new aws.iam.OpenIdConnectProvider("oidcProvider", {
    clientIdLists: [oidcAudience],
    url: oidcIdpUrl,
    thumbprintLists: [thumbprint],
    tags: {
        ManagedBy: "Pulumi",
        Environment: pulumi.getStack(),
    },
});

// Create IAM role policy document
const policyDocument = provider.arn.apply(arn => aws.iam.getPolicyDocument({
    version: "2012-10-17",
    statements: [{
        effect: "Allow",
        actions: ["sts:AssumeRoleWithWebIdentity"],
        principals: [{
            type: "Federated",
            identifiers: [arn],
        }],
        conditions: [{
            test: "StringEquals",
            variable: `api.pulumi.com/oidc:aud`,
            values: [oidcAudience],
        }],
    }],
}));

// Create IAM role
const role = new aws.iam.Role(roleName, {
    assumeRolePolicy: policyDocument.json,
    tags: {
        ManagedBy: "Pulumi",
        Environment: pulumi.getStack(),
    },
});

// Attach policy to role
const policyAttachment = new aws.iam.RolePolicyAttachment("policy-attachment", {
    policyArn: policyArn,
    role: role.name,
});

// Create ESC environment YAML
const envYaml = pulumi.interpolate`
values:
  aws:
    login:
      fn::open::aws-login:
        oidc:
          duration: ${sessionDuration}
          roleArn: ${role.arn}
          sessionName: pulumi-esc
  environmentVariables:
    AWS_ACCESS_KEY_ID: \${aws.login.accessKeyId}
    AWS_SECRET_ACCESS_KEY: \${aws.login.secretAccessKey}
    AWS_SESSION_TOKEN: \${aws.login.sessionToken}
`;

// Create ESC environment
const environment = new pulumiservice.Environment("aws-esc-oidc-env", {
    organization: pulumiOrg,
    project: escProject,
    name: escEnvName,
    yaml: envYaml.apply(yaml => new pulumi.asset.StringAsset(yaml)),
});

// Export values
export const escEnvironment = pulumi.interpolate`${escProject}/${escEnvName}`;
export const roleArn = role.arn;
export const providerId = provider.id;
export const environmentId = environment.id;
