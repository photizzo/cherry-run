variable "aws_access_key_id" {}
variable "aws_secret_access_key" {}
variable "aws_session_token" {}

variable "aws_region" {
  description = "The AWS region to deploy resources"
  default     = "us-east-1" 
}

# Configure the AWS provider
provider "aws" {
  region = "us-east-1"
}

# Create a VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "umpire-run-vpc"
  }
}

# Create a public subnet within the VPC
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1a" 

  tags = {
    Name = "umpire-run-public-subnet"
  }
}

# Create an Internet Gateway and attach it to the VPC
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "umpire-run-igw"
  }
}

# Create a route table for the public subnet
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "umpire-run-public-route-table"
  }
}

# Associate the public subnet with the public route table
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Create a security group for the EC2 instance
resource "aws_security_group" "allow_web" {
  name        = "allow_web_traffic"
  description = "Allow inbound web traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow_web"
  }
}

# Create an EC2 instance
resource "aws_instance" "web" {
  ami           = "ami-0ba9883b710b05ac6"  # Amazon Linux 2023 AMI
  instance_type = "t2.micro"
  key_name      = "assignment2-ec2-ssh-key"

  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.allow_web.id]
  associate_public_ip_address = true

  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo yum install -y docker
              sudo systemctl start docker
              sudo systemctl enable docker
              sudo usermod -a -G docker ec2-user
              sudo docker pull em492028/umpire-run:latest
              sudo docker run -d -p 80:3000 \
                -e AWS_REGION="${var.aws_region}" \
                -e AWS_BUCKET_NAME="umpire-run-bucket" \
                -e AWS_ACCESS_KEY_ID="${var.aws_access_key_id}" \
                -e AWS_SECRET_ACCESS_KEY="${var.aws_secret_access_key}" \
                -e AWS_SESSION_TOKEN="${var.aws_session_token}" \
                em492028/umpire-run:latest
              EOF

  tags = {
    Name = "umpire-run-web-server"
  }
}

# Output the public IP of the EC2 instance
output "public_ip" {
  value = aws_instance.web.public_ip
}