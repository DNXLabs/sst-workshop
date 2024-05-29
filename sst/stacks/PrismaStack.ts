import * as lambda from "aws-cdk-lib/aws-lambda";
import { StackContext,Api, Config } from "sst/constructs";
import fs from 'fs-extra';
import path from 'node:path';

export const preparePrismaLayerFiles = () => {
  const layerPath = "./layers/prisma";
  fs.rmSync(layerPath, { force: true, recursive: true });
  fs.mkdirSync(layerPath, { recursive: true });
  const files = ["node_modules/.prisma", "node_modules/@prisma/client", "node_modules/prisma/build"];
  for (const file of files) {
    // Do not include binary files that aren't for AWS to save space
    fs.copySync(file, path.join(layerPath, "nodejs", file), {
      filter: (src) => !src.endsWith("so.node") || src.includes("rhel"),
    });
  }
}

export const ApiStack = ({ stack }: StackContext) => {

  const DB_HOST = new Config.Secret(stack, "DB_HOST")
  const DB_USER = new Config.Secret(stack, "DB_USER")
  const DB_PASSWORD = new Config.Secret(stack, "DB_PASSWORD")

  
  preparePrismaLayerFiles();
  const PrismaLayer = new lambda.LayerVersion(stack, "PrismaLayer", {
    description: 'Prisma layer',
    code: lambda.Code.fromAsset('./layers/prisma'),
  });


  const api = new Api(stack, 'prisma-api', {
    defaults: {
      function: {
        runtime: 'nodejs18.x',
        environment: {
          DATABASE_URL: `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}`
        },
        nodejs: {
          esbuild: {
            external: ['@prisma/client', '.prisma'],
          },
        },
        layers: [PrismaLayer],
      }
    },
    routes: {
      "GET /": "packages/functions/src/prisma.handler",
    }
  });

  stack.addOutputs({
    'api url:': api.url
  });

}