/* =====================================================================
   Lambda functions built from the api/ code (TypeScript, bundled with
   esbuild against the repo's own package-lock.json).
===================================================================== */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as logs from 'aws-cdk-lib/aws-logs'
import type { Construct } from 'constructs'

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export interface ApiFunctionProps {
  entry: string // relative to the repo root
  environment?: Record<string, string>
  timeout?: Duration
  // a folder to ship next to the code (e.g. SQL migrations)
  copyIntoBundle?: { from: string; to: string }
}

// A path as a single-quoted JS string, for `node -e "..."` under cmd.exe and sh alike.
const jsString = (p: string) => `'${JSON.stringify(p).slice(1, -1)}'`

export function apiFunction(scope: Construct, id: string, props: ApiFunctionProps) {
  const copy = props.copyIntoBundle
  return new nodejs.NodejsFunction(scope, id, {
    entry: path.join(REPO_ROOT, props.entry),
    projectRoot: REPO_ROOT,
    depsLockFilePath: path.join(REPO_ROOT, 'package-lock.json'),
    runtime: lambda.Runtime.NODEJS_24_X,
    architecture: lambda.Architecture.ARM_64,
    memorySize: 512,
    timeout: props.timeout ?? Duration.seconds(15),
    environment: { NODE_OPTIONS: '--enable-source-maps', ...props.environment },
    logGroup: new logs.LogGroup(scope, `${id}Logs`, {
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: RemovalPolicy.DESTROY, // don't outlive the stack (or a failed first deploy)
    }),
    bundling: {
      minify: true,
      sourceMap: true,
      // Bundle the AWS SDK too (the versions the tests ran against). pg-native is
      // pg's optional native driver, which is never loaded.
      externalModules: ['pg-native'],
      commandHooks: copy
        ? {
            beforeBundling: () => [],
            beforeInstall: () => [],
            // node is there wherever the bundling runs (Windows, macOS, Linux, Docker)
            afterBundling: (_input, output) => [
              `node -e "require('fs').cpSync(${jsString(copy.from)}, ${jsString(path.join(output, copy.to))}, { recursive: true })"`,
            ],
          }
        : undefined,
    },
  })
}
