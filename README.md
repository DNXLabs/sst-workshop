# CHANGELOG
## First content add
Added SST and Terraform folder

Did not deploy network config

### TF 
deploys a database and an apigateway for the practical workshop

Need to add:
aws_account_id in ./terraform/workspaces/labs.yml
add vars in ./terraform/backend.tf
add aws_role and vpn_cidr in ./terraform/settings.tf

### SST

Need to cp ./sst/.env.example to ./sst/.env and add DB vars

run "make full_setup"