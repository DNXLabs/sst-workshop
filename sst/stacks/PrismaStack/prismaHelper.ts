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


