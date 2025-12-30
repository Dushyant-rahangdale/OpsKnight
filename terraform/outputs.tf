output "vpc_id" {
  value = data.aws_vpc.default.id
}

output "subnet_ids" {
  value = data.aws_subnets.default.ids
}

output "security_group_id" {
  value = aws_security_group.web_sg.id
}

output "volume_id" {
  value = aws_ebs_volume.postgres_data.id
}
