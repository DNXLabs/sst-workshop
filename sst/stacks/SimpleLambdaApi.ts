import { HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import { StackContext, Api, EventBus } from "sst/constructs";



const Routes = {
  "GET /": "packages/functions/src/lambda.handler",
  
  // Default route in non-default stage 
  // "$default": "packages/functions/src/lambda.handler",
}



// Starts at the simplest example and will progress in complexity
export function API({ stack }: StackContext) {

  const api = new Api(stack, "api", {
    routes: Routes,
    
    // Firstly it would one use its own created gateway
    // Later show how to use existing one
    // cdk: {
    //   httpApi: HttpApi.fromHttpApiAttributes(stack, "http-gateway-workshop", {
    //     httpApiId: "",
    //   })
    // },
  })
  
  stack.addOutputs({
    ApiEndpoint: api.url,
  });

}
