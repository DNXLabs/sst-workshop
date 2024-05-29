provider "aws" {
  region = "ap-southeast-2"

  assume_role {
    role_arn = "arn:aws:iam::${local.workspace.aws_account_id}:role/${local.aws_role}"
  }
}

provider "aws" {
  region = "us-east-1"
  alias  = "us-east-1"

  assume_role {
    role_arn = "arn:aws:iam::${local.workspace.aws_account_id}:role/${local.aws_role}"
  }
}

locals {
  workspace = yamldecode(file("./.workspaces/${terraform.workspace}.yml"))
  aws_role  = ""
  vpn_cidr  = ""
}