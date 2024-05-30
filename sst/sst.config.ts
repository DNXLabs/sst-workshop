import { SSTConfig } from "sst";
import { ApiStack } from "./stacks/PrismaStack.js";
import { API } from "./stacks/SimpleLambdaApi.js";

export default {
  config(_input) {
    return {
      name: "sst-workshop",
      region: "ap-southeast-2",
      profile: "dev"
    };
  },
  stacks(app) {
    app.stack(API);
    app.stack(ApiStack)
  }
} satisfies SSTConfig;
