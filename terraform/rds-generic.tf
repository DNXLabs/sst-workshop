resource "aws_db_instance" "db_instances" {
  for_each = { for db in try(local.workspace.rds, []) : db.name => db }

  multi_az                              = try(each.value.multi_az, false)
  allocated_storage                     = each.value.allocated_storage
  storage_type                          = each.value.storage_type
  engine                                = each.value.engine
  engine_version                        = each.value.engine_version
  instance_class                        = each.value.instance_class
  db_name                               = each.value.name
  backup_retention_period               = each.value.backup_retention_period
  identifier                            = "${local.workspace["environment_name"]}-${each.value.identifier}"
  username                              = each.value.user
  storage_encrypted                     = true
  password                              = random_string.db_pass["${each.value.name}"].result
  db_subnet_group_name                  = "${local.workspace["account_name"]}-dbsubnet"
  parameter_group_name                  = aws_db_parameter_group.rds_param_group_generic["${each.value.name}"].name
  option_group_name                     = each.value.audit_query_log == true ? aws_db_option_group.rds_option_group_generic["${each.value.name}"].id : null
  vpc_security_group_ids                = tolist([aws_security_group.security_groups_generic["${each.value.name}"].id])
  apply_immediately                     = try(each.value.apply_immediately, true)
  skip_final_snapshot                   = try(each.value.skip_final_snapshot, true)
  auto_minor_version_upgrade            = try(each.value.auto_minor_version_upgrade, false)
  deletion_protection                   = try(each.value.deletion_protection, false)
  snapshot_identifier                   = try(each.value.snapshot_identifier, null)
  kms_key_id                            = try(each.value.kms_key_id, null)
  enabled_cloudwatch_logs_exports       = each.value.enabled_logs_exports
  performance_insights_enabled          = try(each.value.performance_insights, false)
  performance_insights_kms_key_id       = try(each.value.performance_insights, false) ? try(each.value.kms_key_id, "") : ""
  performance_insights_retention_period = try(each.value.performance_insights, false) ? each.value.performance_insights_retention : null
  monitoring_interval                   = try(each.value.monitoring_interval, 0)
  monitoring_role_arn                   = try(each.value.enhanced_monitoring, false) ? aws_iam_role.rds_enhanced_monitoring_role[each.value.name].arn : null
  iam_database_authentication_enabled   = try(each.value.iam_auth, true)

  // NEED TO CHECK THIS BEFORE DEPLOY
  # depends_on = [
  #   for k, v in each.value.enabled_logs_exports : 
  #     aws_cloudwatch_log_group.rds_log_groups_generic["${v.db_identifier}-${v.log_group}"]
  # ]


  lifecycle {
    ignore_changes = [db_name, storage_encrypted]
  }
}


resource "aws_iam_role" "rds_enhanced_monitoring_role" {
  for_each = { for db in try(local.workspace.rds, []) : db.name => db if try(db.enhanced_monitoring, false) }

  name = "${local.workspace["environment_name"]}-${each.value.identifier}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy" "rds_enhanced_monitoring_policy" {
  for_each = { for db in try(local.workspace.rds, []) : db.name => db if try(db.enhanced_monitoring, false) }
  name     = "${local.workspace["environment_name"]}-${each.value.identifier}-rds-monitoring-policy"
  role     = aws_iam_role.rds_enhanced_monitoring_role["${each.value.name}"].id

  # These IAM permissions were taken verbatim from arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "EnableCreationAndManagementOfRDSCloudwatchLogGroups",
        "Effect" : "Allow",
        "Action" : [
          "logs:CreateLogGroup",
          "logs:PutRetentionPolicy"
        ],
        "Resource" : [
          "arn:aws:logs:*:*:log-group:RDS*"
        ]
      },
      {
        "Sid" : "EnableCreationAndManagementOfRDSCloudwatchLogStreams",
        "Effect" : "Allow",
        "Action" : [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents"
        ],
        "Resource" : [
          "arn:aws:logs:*:*:log-group:RDS*:log-stream:*"
        ]
      }
    ]
  })
}



resource "random_string" "db_pass" {
  for_each = { for db in try(local.workspace.rds, []) : db.name => db }
  length   = 34
  special  = false
  keepers = {
    update_date = "18/07/2023"
  }
}

resource "aws_ssm_parameter" "rds_endpoint_generic" {
  for_each    = { for db in try(local.workspace.rds, []) : db.name => db }
  name        = "/rds/${local.workspace["environment_name"]}/${each.value.identifier}/ENDPOINT"
  description = "RDS Endpoint"
  type        = "String"
  value       = aws_db_instance.db_instances["${each.value.name}"].endpoint
}

resource "aws_ssm_parameter" "rds_address_generic" {
  for_each    = { for db in try(local.workspace.rds, []) : db.name => db }
  name        = "/rds/${local.workspace["environment_name"]}/${each.value.identifier}/HOST"
  description = "RDS Hostname"
  type        = "String"
  value       = aws_db_instance.db_instances["${each.value.name}"].address
}

resource "aws_ssm_parameter" "rds_name_generic" {
  for_each    = { for db in try(local.workspace.rds, []) : db.name => db }
  name        = "/rds/${local.workspace["environment_name"]}/${each.value.identifier}/NAME"
  description = "RDS DB Name"
  type        = "String"
  value       = each.value.name
}

resource "aws_ssm_parameter" "rds_username_generic" {
  for_each    = { for db in try(local.workspace.rds, []) : db.name => db }
  name        = "/rds/${local.workspace["environment_name"]}/${each.value.identifier}/USERNAME"
  description = "RDS Username"
  type        = "String"
  value       = each.value.user
}

resource "aws_ssm_parameter" "rds_password_generic" {
  for_each    = { for db in try(local.workspace.rds, []) : db.name => db }
  name        = "/rds/${local.workspace["environment_name"]}/${each.value.identifier}/PASSWORD"
  description = "RDS Password"
  type        = "SecureString"
  value       = random_string.db_pass["${each.value.name}"].result
}

locals {
  flattened_log_groups = flatten([
    for db in try(local.workspace.rds, []) : [
      for log_group in db.enabled_logs_exports : {
        db_identifier = db.identifier
        log_group     = log_group
      }
    ]
  ])
}

resource "aws_cloudwatch_log_group" "rds_log_groups_generic" {
  for_each = { for index, entry in local.flattened_log_groups : "${entry.db_identifier}-${entry.log_group}" => entry }

  name              = "/aws/rds/instance/${local.workspace["environment_name"]}-${each.value.db_identifier}/${each.value.log_group}"
  retention_in_days = 1
}


resource "aws_security_group" "security_groups_generic" {
  for_each = { for db in try(local.workspace.rds, []) : db.name => db }
  name     = "rds-${local.workspace["environment_name"]}-${each.value.name}"
  vpc_id   = data.aws_vpc.selected.id

  tags = try(each.value.tags, null)

  lifecycle {
    create_before_destroy = true
  }
}


resource "aws_security_group_rule" "rds_inbound_vpn_generic" {
  for_each          = { for db in try(local.workspace.rds, []) : db.name => db }
  type              = "ingress"
  from_port         = each.value.db_port
  to_port           = each.value.db_port
  protocol          = "tcp"
  cidr_blocks       = tolist([local.vpn_cidr])
  security_group_id = aws_security_group.security_groups_generic["${each.value.name}"].id
  description       = "VPN Access"
}