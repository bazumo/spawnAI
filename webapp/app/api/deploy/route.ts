import { NextRequest, NextResponse } from 'next/server';
import { VMConfiguration } from '@/types/vm';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { vmConfig }: { vmConfig: VMConfiguration } = await request.json();

    // Create deployment directory
    const deploymentId = `deployment-${vmConfig.id}-${Date.now()}`;
    const deploymentDir = path.join(process.cwd(), 'deployments', deploymentId);
    await fs.mkdir(deploymentDir, { recursive: true });

    // Generate SSH key pair
    const sshKeyName = `vm-key-${vmConfig.id}`;
    const sshKeyPath = path.join(deploymentDir, sshKeyName);

    try {
      await execAsync(`ssh-keygen -t rsa -b 4096 -f "${sshKeyPath}" -N "" -C "${vmConfig.name}"`);
    } catch (error) {
      console.error('SSH key generation error:', error);
    }

    // Generate Terraform configuration
    const terraformConfig = generateTerraformConfig(vmConfig, sshKeyName, sshKeyPath);
    await fs.writeFile(path.join(deploymentDir, 'main.tf'), terraformConfig);

    // Generate variables file
    const tfvarsContent = generateTfvars(vmConfig);
    await fs.writeFile(path.join(deploymentDir, 'terraform.tfvars'), tfvarsContent);

    // Generate setup script
    const setupScript = generateSetupScript(vmConfig);
    await fs.writeFile(path.join(deploymentDir, 'setup.sh'), setupScript);
    await execAsync(`chmod +x "${path.join(deploymentDir, 'setup.sh')}"`);

    // Initialize and apply Terraform
    try {
      // Initialize Terraform
      await execAsync('terraform init', { cwd: deploymentDir });

      // Apply Terraform configuration
      await execAsync('terraform apply -auto-approve', { cwd: deploymentDir });

      // Get output values
      const { stdout: ipOutput } = await execAsync('terraform output -raw public_ip', {
        cwd: deploymentDir,
      });
      const publicIp = ipOutput.trim();

      // Wait for instance to be ready
      await new Promise((resolve) => setTimeout(resolve, 30000));

      // Run setup script on the instance
      try {
        await execAsync(
          `scp -i "${sshKeyPath}" -o StrictHostKeyChecking=no "${path.join(
            deploymentDir,
            'setup.sh'
          )}" ubuntu@${publicIp}:/tmp/setup.sh`
        );
        await execAsync(
          `ssh -i "${sshKeyPath}" -o StrictHostKeyChecking=no ubuntu@${publicIp} "chmod +x /tmp/setup.sh && sudo /tmp/setup.sh"`
        );
      } catch (error) {
        console.error('Setup script execution error:', error);
      }

      return NextResponse.json({
        success: true,
        vmId: vmConfig.id,
        publicIp,
        sshKeyName,
        deploymentDir,
      });
    } catch (error) {
      console.error('Terraform error:', error);
      // Cleanup on failure
      try {
        await execAsync('terraform destroy -auto-approve', { cwd: deploymentDir });
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Terraform deployment failed',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function generateTerraformConfig(
  vmConfig: VMConfiguration,
  sshKeyName: string,
  sshKeyPath: string
): string {
  return `
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "instance_name" {
  description = "Name tag for the instance"
  type        = string
}

variable "application" {
  description = "Application to install"
  type        = string
}

# Import the public key
resource "aws_key_pair" "vm_key" {
  key_name   = "${sshKeyName}"
  public_key = file("${sshKeyPath}.pub")
}

# Security group for SSH and application access
resource "aws_security_group" "vm_sg" {
  name        = "vm-sg-\${var.instance_name}"
  description = "Security group for VM instance"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "VS Code Server"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Application Port"
    from_port   = 3000
    to_port     = 3000
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
    Name = "vm-sg-\${var.instance_name}"
  }
}

# Get the latest Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# EC2 Instance
resource "aws_instance" "vm" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name              = aws_key_pair.vm_key.key_name
  vpc_security_group_ids = [aws_security_group.vm_sg.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  tags = {
    Name        = var.instance_name
    Application = var.application
  }
}

output "public_ip" {
  value = aws_instance.vm.public_ip
}

output "instance_id" {
  value = aws_instance.vm.id
}
`;
}

function generateTfvars(vmConfig: VMConfiguration): string {
  return `
aws_region    = "${vmConfig.region}"
instance_type = "${vmConfig.instanceSize}"
instance_name = "${vmConfig.name}"
application   = "${vmConfig.application}"
`;
}

function generateSetupScript(vmConfig: VMConfiguration): string {
  let appInstallScript = '';

  switch (vmConfig.application) {
    case 'vscode':
      appInstallScript = `
# Install VS Code Server
curl -fsSL https://code-server.dev/install.sh | sh
sudo systemctl enable --now code-server@ubuntu

# Configure code-server
mkdir -p ~/.config/code-server
cat > ~/.config/code-server/config.yaml << EOF
bind-addr: 0.0.0.0:8080
auth: password
password: changeme
cert: false
EOF

sudo systemctl restart code-server@ubuntu
`;
      break;

    case 'claude-code':
      appInstallScript = `
# Install Node.js (required for Claude Code)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Claude Code
sudo npm install -g @anthropic-ai/claude-code

# Create a startup script
cat > ~/start-claude-code.sh << 'EOF'
#!/bin/bash
claude-code
EOF
chmod +x ~/start-claude-code.sh
`;
      break;

    default:
      appInstallScript = '# No application to install';
  }

  return `#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install common tools
apt-get install -y curl wget git build-essential

${appInstallScript}

# Setup complete
echo "Setup completed successfully!"
`;
}
