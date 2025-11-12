# VM Orchestration App

A visual application for deploying and managing AWS EC2 instances with automated Terraform provisioning and application setup.

![VM Orchestration](https://img.shields.io/badge/Next.js-16.0-black)
![React Flow](https://img.shields.io/badge/React_Flow-enabled-blue)
![Terraform](https://img.shields.io/badge/Terraform-Infrastructure-purple)

## Overview

This application provides a drag-and-drop interface for designing and deploying AWS EC2 infrastructure. It uses React Flow for visual node management and Terraform for infrastructure provisioning.

## Features

### Visual Design
- **Drag-and-Drop Interface**: Intuitive node-based canvas using React Flow
- **Predefined Machines**: Quick-start templates for common configurations
- **Custom Machine Generation**: AI-powered prompt-based machine creation
- **Real-time Configuration**: Edit instance settings directly on the canvas
- **Deployment Status**: Visual indicators for pending, deploying, deployed, and failed states

### Infrastructure Management
- **Multiple AWS Regions**: Support for 9 AWS regions globally
- **Instance Type Selection**: Choose from t2, t3, m5, and c5 instance families
- **Application Installation**: Pre-configured setups for VS Code Server and Claude Code
- **Automated SSH Keys**: Secure key pair generation for each deployment
- **Terraform Backend**: Infrastructure as Code with automatic provisioning

### Supported Applications
- **VS Code Server**: Browser-based development environment
- **Claude Code**: Anthropic's AI-powered coding assistant
- **Blank Instances**: Plain Ubuntu 22.04 for custom setups

## Quick Start

1. **Prerequisites**:
   ```bash
   # Install Terraform
   brew install terraform  # macOS
   # or
   sudo apt install terraform  # Ubuntu/Debian

   # Configure AWS CLI
   aws configure
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Creating VMs

**Method 1: Drag Predefined Machines**
1. Browse machines in the left sidebar
2. Drag any machine onto the canvas
3. Configure settings as needed
4. Click "Deploy VM"

**Method 2: Generate Custom Machines**
1. Use the prompt box in the sidebar
2. Describe your requirements (e.g., "VS Code in EU with large instance")
3. Click "Generate Machine"
4. Machine appears on canvas ready to deploy

### Configuring VMs

Each node on the canvas offers:
- **AWS Region**: Select deployment region
- **Instance Size**: Choose EC2 instance type
- **Application**: Select pre-installed software

### Deploying VMs

1. Review configuration on the node
2. Click "Deploy VM" button
3. Monitor deployment progress (2-5 minutes)
4. Access deployed instance via displayed IP and SSH key

## Project Structure

```
webapp/
├── app/
│   ├── api/
│   │   └── deploy/          # Deployment API endpoint
│   │       └── route.ts     # Terraform execution logic
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main application page
├── components/
│   ├── Sidebar.tsx          # Machine library & custom generator
│   ├── VMCanvas.tsx         # React Flow canvas logic
│   └── VMNode.tsx           # Custom VM node component
├── types/
│   └── vm.ts                # TypeScript type definitions
├── lib/
│   ├── predefined-machines.ts  # Machine templates
│   └── utils.ts             # Utility functions
├── terraform/
│   └── variables.tf         # Terraform variable definitions
├── deployments/             # Generated Terraform configs (gitignored)
└── SETUP.md                 # Detailed setup instructions
```

## Architecture

### Frontend Stack
- **Next.js 15**: React framework with App Router
- **React Flow**: Node-based visual interface library
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type-safe development

### Backend Stack
- **Next.js API Routes**: RESTful deployment endpoints
- **Terraform**: Infrastructure provisioning
- **AWS EC2**: Virtual machine hosting
- **Node.js**: Setup script execution

### Deployment Flow
```
User Action → Frontend API Call → Generate Terraform Config →
→ Provision Infrastructure → Install Applications → Return Status
```

## Configuration

### AWS Regions
- US East (N. Virginia, Ohio)
- US West (N. California, Oregon)
- EU West (Ireland)
- EU Central (Frankfurt)
- Asia Pacific (Tokyo, Singapore, Sydney)

### Instance Types
| Size | vCPUs | Memory | Use Case |
|------|-------|--------|----------|
| t2.micro | 1 | 1 GB | Testing |
| t3.small | 2 | 2 GB | Light workloads |
| t3.medium | 2 | 4 GB | Development |
| t3.large | 2 | 8 GB | Standard apps |
| m5.large | 2 | 8 GB | Production |
| m5.xlarge | 4 | 16 GB | High performance |

## Security

- **SSH Keys**: Generated per deployment, stored locally
- **Security Groups**: Configured with ports 22 (SSH), 8080 (VS Code), 3000 (Apps)
- **AWS Credentials**: Required but never stored in application
- **Default Passwords**: Change immediately after deployment

## Cost Estimation

Monthly AWS costs (approximate):
- **t2.micro**: $8-10/month (free tier eligible)
- **t3.small**: $15-20/month
- **t3.medium**: $30-40/month
- **t3.large**: $60-70/month
- **m5.large**: $70-80/month
- **m5.xlarge**: $140-160/month

## Development

### Build for Production
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Troubleshooting

**Deployment Fails**
- Verify AWS credentials: `aws sts get-caller-identity`
- Check Terraform installation: `terraform --version`
- Review AWS quotas in target region

**Cannot Connect to Instance**
- Wait 2-3 minutes for initialization
- Verify security group rules
- Check SSH key permissions: `chmod 600 <key-file>`

**Type Errors**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React Flow Documentation](https://reactflow.dev)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2)

## Support

For detailed setup instructions, see [SETUP.md](./SETUP.md)

For issues and feature requests, please open a GitHub issue.

---

**Note**: This application provisions real AWS resources that incur costs. Always remember to destroy resources when done:

```bash
cd deployments/<deployment-id>
terraform destroy -auto-approve
```
