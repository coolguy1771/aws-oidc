# AWS OIDC Pulumi program in TypeScript

A Pulumi template to:

- Create AWS resources for AWS OIDC (IdP + Role)
- Create a new Pulumi Cloud ESC Environment

Last update: March 2025

## 📋 Pre-requisites

- AWS CLI and an AWS Account configured
- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
- [Pulumi Cloud account](https://app.pulumi.com/signup)
- [npm](https://www.npmjs.com/get-npm)

## 👩‍🏫 Get started

This Pulumi example is written as a template. It is meant to be copied via `pulumi new`

```bash
# login to your Pulumi Cloud if you haven't already
pulumi login

# pick a name for your output directory (--dir is optional, omit for pwd)
D=my-aws-oidc
pulumi new https://github.com/pulumi/examples/aws-ts-oidc-provider-pulumi-cloud --dir ${D}
cd ${D}
```

Once copied to your machine, feel free to edit as needed.

## 🔧 Configuration

This template supports the following configuration parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `escProject` | The Pulumi ESC project name | (required) |
| `escEnvironmentName` | The Pulumi ESC environment name | (required) |
| `sessionDuration` | The duration of the AWS session | `1h` |
| `roleName` | The name of the IAM role to create | `pulumi-cloud-admin` |
| `policyArn` | The ARN of the IAM policy to attach | `arn:aws:iam::aws:policy/AdministratorAccess` |

To set configuration values, use:

```bash
pulumi config set aws-oidc:sessionDuration 2h
```

## 🎬 How to run

This template will pick up the thumbprint from the URL that you set in the stack configuration. By default, it will use the OIDC IDP URL for Pulumi Cloud.

To deploy your infrastructure, run:

```bash
$ pulumi up
# select 'yes' to confirm the expected changes
# 🎉 Ta-Da!
```

## 📝 Outputs

After successful deployment, the following outputs are available:

- `escEnvironment`: The path to the created ESC environment (`project/env`)
- `roleArn`: The ARN of the created IAM role
- `providerId`: The ID of the OIDC provider
- `environmentId`: The ID of the created Pulumi ESC environment

## 🧹 Clean up

To clean up your infrastructure, run:

```bash
$ pulumi destroy
# select 'yes' to confirm the expected changes
```
