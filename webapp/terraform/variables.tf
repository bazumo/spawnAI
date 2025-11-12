variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "instance_name" {
  description = "Name tag for the instance"
  type        = string
}

variable "application" {
  description = "Application to install on the instance"
  type        = string
  default     = "none"
}
