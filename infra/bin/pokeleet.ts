/* =====================================================================
   The CDK app. Context (-c key=value, or cdk.json):
     stage           dev (default) | prod
     budgetEmail     where to send monthly cost alerts (optional)
     googleClientId  adds "Continue with Google" (optional, docs/deploying.md)
     domain          the app's own address, e.g. pokeleet.example.com; adds
                     the Pokeleet-Dns stack (optional, docs/deploying.md)
     githubRepo      owner/repo, to create the GitHub deploy role (optional)
===================================================================== */
import path from 'node:path'
import { App } from 'aws-cdk-lib'
import { REPO_ROOT } from '../lib/bundling.ts'
import { DnsStack } from '../lib/dns-stack.ts'
import { GithubDeployStack } from '../lib/github-deploy-stack.ts'
import { PokeleetStack } from '../lib/pokeleet-stack.ts'

const app = new App()
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
const stage = String(app.node.tryGetContext('stage') ?? 'dev')
const domain: string | undefined = app.node.tryGetContext('domain') || undefined

const dns = domain ? new DnsStack(app, 'Pokeleet-Dns', { env, domain }) : undefined

new PokeleetStack(app, `Pokeleet-${stage}`, {
  env,
  stage,
  webAssetsDir: path.join(REPO_ROOT, 'dist'),
  budgetEmail: app.node.tryGetContext('budgetEmail'),
  googleClientId: app.node.tryGetContext('googleClientId') || undefined,
  domain: domain && dns ? { name: domain, zone: dns.zone } : undefined,
  tags: { project: 'pokeleet', stage },
})

const repo = app.node.tryGetContext('githubRepo')
if (repo) new GithubDeployStack(app, 'Pokeleet-GithubDeploy', { env, repo })
