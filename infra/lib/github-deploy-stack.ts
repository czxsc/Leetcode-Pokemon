/* =====================================================================
   Lets GitHub Actions deploy without stored AWS keys: the workflow
   signs in with GitHub's OIDC token and assumes this role, which may
   only assume the CDK bootstrap roles (that do the actual deploying),
   and only from the repo's main branch.
   Deploy once by hand: npx cdk deploy Pokeleet-GithubDeploy -c githubRepo=<owner>/<repo>
===================================================================== */
import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'

export class GithubDeployStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & { repo: string }) {
    super(scope, id, props)

    const provider = new iam.OpenIdConnectProvider(this, 'GithubOidc', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    })

    const role = new iam.Role(this, 'DeployRole', {
      description: `Deploys PokéLeet from GitHub Actions (${props.repo})`,
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${props.repo}:ref:refs/heads/main`,
        },
      }),
    })
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [`arn:${this.partition}:iam::${this.account}:role/cdk-*`],
      }),
    )

    new CfnOutput(this, 'DeployRoleArn', { value: role.roleArn })
  }
}
