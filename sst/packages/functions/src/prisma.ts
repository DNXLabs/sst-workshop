import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { PrismaClient } from "prisma/prisma-client";

const client = new PrismaClient();

export const handler: APIGatewayProxyHandlerV2 = async () => {
  console.log("Hello")
  try {
    const result = await client.post.findMany();
    console.log(result)
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (ex) {
    return {
      statusCode: 200,
      body: ex.toString(),
    };
  }
};