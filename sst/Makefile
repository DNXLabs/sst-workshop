######################
# SST Helper commands
######################

## Removes all SST secrets from AWS Secrets Manager in current stage
secret_remove:
	npx sst secrets list "json" | awk '{print $$1}' | tr -d '","'  | tr -d '":"' \
	| tr -d '"}"' | tr -d '"{"' |  sed "$$ d" | sed "1,1d" | while read line; do \
		npx sst secrets remove $$line; \
	done