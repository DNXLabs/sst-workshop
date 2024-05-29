module "http_api" {
  # for_each = { for apigateway in local.workspace.apigateways : apigateway.name => apigateway }
  source = "git::https://github.com/DNXLabs/terraform-aws-api-gateway.git"
  environment_name = "default"
  name = "SST-workshop"
  api_type = "http"
}