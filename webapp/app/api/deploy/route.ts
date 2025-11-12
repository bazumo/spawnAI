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

    console.log('🚀 Starting deployment for VM:', vmConfig.name);
    console.log('📍 Region:', vmConfig.region);
    console.log('💻 Instance Size:', vmConfig.instanceSize);
    console.log('📦 Application:', vmConfig.application);

    // Create deployment directory
    const deploymentId = `deployment-${vmConfig.id}-${Date.now()}`;
    const deploymentDir = path.join(process.cwd(), 'deployments', deploymentId);
    console.log('📁 Creating deployment directory:', deploymentDir);
    await fs.mkdir(deploymentDir, { recursive: true });

    // Generate SSH key pair
    const sshKeyName = `vm-key-${vmConfig.id}`;
    const sshKeyPath = path.join(deploymentDir, sshKeyName);

    console.log('🔑 Generating SSH key pair...');
    try {
      await execAsync(`ssh-keygen -t rsa -b 4096 -f "${sshKeyPath}" -N "" -C "${vmConfig.name}"`);
      console.log('✅ SSH key generated successfully');
    } catch (error) {
      console.error('❌ SSH key generation error:', error);
    }

    // Generate Terraform configuration
    console.log('📝 Generating Terraform configuration...');
    const terraformConfig = generateTerraformConfig(vmConfig, sshKeyName, sshKeyPath);
    await fs.writeFile(path.join(deploymentDir, 'main.tf'), terraformConfig);
    console.log('✅ main.tf created');

    // Generate variables file
    const tfvarsContent = generateTfvars(vmConfig);
    await fs.writeFile(path.join(deploymentDir, 'terraform.tfvars'), tfvarsContent);
    console.log('✅ terraform.tfvars created');

    // Generate setup script
    const setupScript = generateSetupScript(vmConfig);
    await fs.writeFile(path.join(deploymentDir, 'setup.sh'), setupScript);
    await execAsync(`chmod +x "${path.join(deploymentDir, 'setup.sh')}"`);
    console.log('✅ setup.sh created');

    // Initialize and apply Terraform
    try {
      // Initialize Terraform
      console.log('🔧 Initializing Terraform...');
      const { stdout: initOutput } = await execAsync('terraform init', { cwd: deploymentDir });
      console.log('Terraform init output:', initOutput);
      console.log('✅ Terraform initialized');

      // Apply Terraform configuration
      console.log('🚀 Applying Terraform configuration (creating EC2 instance)...');
      console.log('⏳ This may take 1-2 minutes...');
      const { stdout: applyOutput } = await execAsync('terraform apply -auto-approve', { cwd: deploymentDir });
      console.log('Terraform apply output:', applyOutput);
      console.log('✅ Terraform apply complete');

      // Get output values
      console.log('📊 Getting instance details...');
      const { stdout: ipOutput } = await execAsync('terraform output -raw public_ip', {
        cwd: deploymentDir,
      });
      const publicIp = ipOutput.trim();
      console.log('✅ Public IP:', publicIp);

      const sshCommand = `ssh -i "${sshKeyPath}" ubuntu@${publicIp}`;
      console.log('🔐 SSH Command:', sshCommand);

      // Wait for instance to be ready
      console.log('⏳ Waiting 30 seconds for instance to boot...');
      await new Promise((resolve) => setTimeout(resolve, 30000));
      console.log('✅ Instance should be ready');

      // Run setup script on the instance
      console.log('📦 Installing applications on the instance...');
      try {
        console.log('📤 Copying setup script to instance...');
        await execAsync(
          `scp -i "${sshKeyPath}" -o StrictHostKeyChecking=no "${path.join(
            deploymentDir,
            'setup.sh'
          )}" ubuntu@${publicIp}:/tmp/setup.sh`
        );
        console.log('✅ Setup script copied');

        console.log('🔧 Running setup script on instance...');
        const { stdout: setupOutput } = await execAsync(
          `ssh -i "${sshKeyPath}" -o StrictHostKeyChecking=no ubuntu@${publicIp} "chmod +x /tmp/setup.sh && sudo /tmp/setup.sh"`
        );
        console.log('Setup script output:', setupOutput);
        console.log('✅ Application setup complete');
      } catch (error) {
        console.error('❌ Setup script execution error:', error);
        console.log('⚠️ Instance created but application installation may have failed');
      }

      console.log('🎉 Deployment complete!');
      console.log('📝 Summary:');
      console.log('  - VM ID:', vmConfig.id);
      console.log('  - Public IP:', publicIp);
      console.log('  - SSH Key:', sshKeyName);
      console.log('  - Deployment Dir:', deploymentDir);

      return NextResponse.json({
        success: true,
        vmId: vmConfig.id,
        publicIp,
        sshKeyName,
        deploymentDir,
        sshCommand,
      });
    } catch (error) {
      console.error('❌ Terraform error:', error);
      console.log('🧹 Attempting cleanup...');

      // Cleanup on failure
      try {
        await execAsync('terraform destroy -auto-approve', { cwd: deploymentDir });
        console.log('✅ Cleanup complete');
      } catch (cleanupError) {
        console.error('❌ Cleanup error:', cleanupError);
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Terraform deployment failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Deployment error:', error);
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
