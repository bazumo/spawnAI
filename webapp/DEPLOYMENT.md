# SpawnAI Deployment Setup

This application can deploy real EC2 instances on AWS using Terraform.

## Prerequisites

### 1. AWS Credentials

You need AWS credentials configured on the server where Next.js is running. The application uses the default AWS credential chain.

**Option A: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

**Option B: AWS CLI Configuration**
```bash
aws configure
```

**Option C: IAM Role (Recommended for EC2)**
If running on an EC2 instance, attach an IAM role with the following permissions:
- `ec2:*`
- `iam:CreateRole`
- `iam:AttachRolePolicy`

### 2. Anthropic API Key

For AI-powered machine selection:
```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key"
```

### 3. Terraform CLI

Already installed at `/usr/local/bin/terraform` (v1.9.8)

## How It Works

When you click "Deploy VM" on a machine node:

1. **SSH Key Generation**: Creates a unique SSH key pair for the VM
2. **Terraform Configuration**: Generates Terraform files:
   - `main.tf` - Infrastructure definition
   - `terraform.tfvars` - Variable values
   - `setup.sh` - Post-deployment setup script

3. **Terraform Execution**:
   - `terraform init` - Initialize providers
   - `terraform apply -auto-approve` - Create infrastructure
   - Outputs: public IP, instance ID

4. **Application Setup**:
   - Waits 30 seconds for instance to boot
   - Copies and runs setup script via SSH
   - Installs selected application (VS Code, Claude Code, or none)

## Deployed Resources

Each deployment creates:
- **EC2 Instance**: Ubuntu 22.04 LTS (latest AMI)
- **Security Group**: SSH (22), VS Code (8080), App (3000)
- **SSH Key Pair**: For secure access
- **30GB Root Volume**: gp3 storage

## Supported Applications

### VS Code Server (code-server)
- Accessible at `http://<public-ip>:8080`
- Default password: `changeme`
- Configure at `~/.config/code-server/config.yaml`

### Claude Code
- Installed globally via npm
- Run with `~/start-claude-code.sh`
- Requires ANTHROPIC_API_KEY on the VM

### None
- Basic Ubuntu server
- No additional software installed

## Accessing Deployed VMs

The SSH key is stored in:
```
/path/to/webapp/deployments/deployment-<vm-id>-<timestamp>/vm-key-<vm-id>
```

Connect via SSH:
```bash
ssh -i <path-to-key> ubuntu@<public-ip>
```

## Cost Considerations

**Approximate AWS costs (us-east-1, as of 2024):**
- t2.micro: ~$0.0116/hour (~$8.50/month)
- t3.small: ~$0.0208/hour (~$15/month)
- t3.large: ~$0.0832/hour (~$60/month)

**Note**: Don't forget to destroy instances when not needed!

## Destroying Instances

To manually destroy a deployment:
```bash
cd deployments/deployment-<vm-id>-<timestamp>
terraform destroy -auto-approve
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Security Groups**: Currently allow 0.0.0.0/0 (all IPs)
   - For production, restrict to specific IPs
   - Update the security group ingress rules in `route.ts`

2. **VS Code Password**: Default is `changeme`
   - Change immediately after first login
   - Or configure authentication in setup script

3. **SSH Keys**: Stored locally on the server
   - Ensure proper file permissions (600)
   - Backup keys securely
   - Rotate regularly

4. **API Route**: `/api/deploy` has no authentication
   - Add authentication middleware for production
   - Implement rate limiting
   - Add CORS restrictions

## Troubleshooting

### Terraform fails with "No valid credential sources"
- Check AWS credentials are configured
- Verify IAM permissions

### SSH connection times out
- Wait longer for instance to boot (may take 1-2 minutes)
- Check security group allows your IP on port 22
- Verify instance is in "running" state

### Application not accessible
- Check security group allows traffic on application ports
- Verify setup script completed successfully
- SSH into instance and check logs: `journalctl -xe`

## Development Notes

- Deployments are stored in `/deployments/` directory
- Each deployment is isolated with unique SSH keys
- Terraform state is stored locally (not in remote backend)
- Failed deployments attempt automatic cleanup

## Future Improvements

- [ ] Add remote Terraform state (S3 + DynamoDB)
- [ ] Implement deployment cleanup/destroy from UI
- [ ] Add deployment status polling
- [ ] Support custom security group rules
- [ ] Add deployment history/logs
- [ ] Implement authentication for deploy endpoint
- [ ] Support multiple cloud providers
