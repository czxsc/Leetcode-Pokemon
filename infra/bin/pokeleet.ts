/* =====================================================================
   The CDK app. Context (-c key=value, or cdk.json):
     stage        dev (default) | prod
     budgetEmail  where to send monthly cost alerts (optional)
     githubRepo   owner/repo, to create the GitHub deploy role (optional)
===================================================================== */
import path from 'node:path'
import { App } from 'aws-cdk-lib'
import { REPO_ROOT } from '../lib/bundling.ts'
import { GithubDeployStack } from '../lib/github-deploy-stack.ts'
import { PokeleetStack } from '../lib/pokeleet-stack.ts'

const app = new App()
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
const stage = String(app.node.tryGetContext('stage') ?? 'dev')

new PokeleetStack(app, `Pokeleet-${stage}`, {
  env,
  stage,
  webAssetsDir: path.join(REPO_ROOT, 'dist'),
  budgetEmail: app.node.tryGetContext('budgetEmail'),
  tags: { project: 'pokeleet', stage },
})

const repo = app.node.tryGetContext('githubRepo')
if (repo) new GithubDeployStack(app, 'Pokeleet-GithubDeploy', { env, repo })
