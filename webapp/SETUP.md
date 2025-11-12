# VM Orchestration App - Setup Guide

This application allows you to visually design and deploy AWS EC2 instances with pre-configured applications using Terraform.

## Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
2. **Terraform** (v1.0 or higher)
3. **AWS CLI** configured with credentials
4. **SSH** client

### AWS Setup

1. **Configure AWS Credentials**:
   ```bash
   aws configure
   ```
   Provide:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., us-east-1)
   - Default output format (json)

2. **Verify AWS Configuration**:
   ```bash
   aws sts get-caller-identity
   ```

### Terraform Setup

1. **Install Terraform**:
   ```bash
   # On Ubuntu/Debian
   wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
   sudo apt update && sudo apt install terraform

   # On macOS
   brew tap hashicorp/tap
   brew install hashicorp/tap/terraform
   ```

2. **Verify Terraform Installation**:
   ```bash
   terraform --version
   ```

## Installation

1. **Install Dependencies**:
   ```bash
   cd webapp
   npm install
   ```

2. **Set up Environment Variables** (Optional):
   Create a `.env.local` file if you need custom configurations:
   ```bash
   AWS_REGION=us-east-1
   AWS_PROFILE=default
   ```

## Running the Application

1. **Start the Development Server**:
   ```bash
   npm run dev
   ```

2. **Access the Application**:
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Using the Application

### 1. Drag and Drop Predefined Machines
- Browse the predefined machines in the left sidebar
- Drag any machine onto the canvas
- The node will appear with default configuration

### 2. Create Custom Machines
- Use the "Create Custom" prompt box in the sidebar
- Describe your machine requirements, e.g.:
  - "VS Code instance in US East with medium size"
  - "Claude Code in EU West with large instance"
- Click "Generate Machine" to add it to the canvas

### 3. Configure VM Instances
Each node on the canvas shows:
- **AWS Region**: Select from available regions
- **Instance Size**: Choose EC2 instance type
- **Application**: Select application to install (VS Code, Claude Code, or None)

### 4. Deploy VM Instances
1. Review your configuration
2. Click the "Deploy VM" button on the node
3. Wait for deployment (typically 2-5 minutes)
4. Once deployed, you'll see:
   - Public IP address
   - SSH key name
   - Status indicator (green = success)

### 5. Connect to Your VM

**SSH Connection**:
```bash
ssh -i deployments/<deployment-id>/<key-name> ubuntu@<public-ip>
```

**VS Code Server**:
```
http://<public-ip>:8080
Default password: changeme
```

**Claude Code**:
```bash
ssh -i <key-file> ubuntu@<public-ip>
cd ~ && ./start-claude-code.sh
```

## Features

### Supported AWS Regions
- us-east-1, us-east-2
- us-west-1, us-west-2
- eu-west-1, eu-central-1
- ap-northeast-1, ap-southeast-1, ap-southeast-2

### Supported Instance Types
- **t2/t3 series**: micro, small, medium, large
- **m5 series**: large, xlarge
- **c5 series**: large, xlarge

### Available Applications
- **VS Code Server**: Browser-based VS Code
- **Claude Code**: Anthropic's Claude CLI
- **None**: Plain Ubuntu instance

## Architecture

### Frontend
- **Next.js 15**: React framework with App Router
- **React Flow**: Visual node-based interface
- **Tailwind CSS**: Styling

### Backend
- **Next.js API Routes**: Handle deployment requests
- **Terraform**: Infrastructure as Code
- **AWS EC2**: Virtual machine hosting

### Deployment Flow
1. User configures VM in UI
2. Frontend sends configuration to `/api/deploy`
3. Backend generates:
   - Terraform configuration
   - SSH key pair
   - Setup script
4. Terraform provisions EC2 instance
5. Setup script installs requested applications
6. Public IP and SSH key returned to UI

## Troubleshooting

### Deployment Fails
- **Check AWS credentials**: `aws sts get-caller-identity`
- **Verify Terraform**: `terraform --version`
- **Check AWS quotas**: Ensure you have EC2 quota in the region
- **Review logs**: Check browser console and terminal output

### Cannot Connect to VM
- **Wait for initialization**: Give the instance 2-3 minutes after deployment
- **Check security groups**: Ensure ports 22, 8080, 3000 are open
- **Verify key permissions**: `chmod 600 <key-file>`

### VS Code Server Not Accessible
- **Check service status**:
  ```bash
  ssh -i <key> ubuntu@<ip>
  sudo systemctl status code-server@ubuntu
  ```
- **View logs**:
  ```bash
  sudo journalctl -u code-server@ubuntu -f
  ```

## Cost Management

**Important**: Deployed EC2 instances incur AWS charges.

### Estimate Costs
- t2.micro: ~$8-10/month
- t3.small: ~$15-20/month
- t3.medium: ~$30-40/month
- m5.large: ~$70-80/month

### Clean Up Resources
To destroy a deployment:
```bash
cd deployments/<deployment-id>
terraform destroy -auto-approve
```

## Security Considerations

1. **SSH Keys**: Stored locally in `deployments/` directory
2. **Security Groups**: Allow SSH (22), VS Code (8080), App (3000)
3. **Default Passwords**: Change default VS Code password immediately
4. **AWS Credentials**: Never commit credentials to version control

## Development

### Project Structure
```
webapp/
├── app/
│   ├── api/deploy/          # Deployment API endpoint
│   ├── globals.css          # Global styles
│   └── page.tsx             # Main page
├── components/
│   ├── Sidebar.tsx          # Left sidebar with machines
│   ├── VMCanvas.tsx         # React Flow canvas logic
│   └── VMNode.tsx           # Custom VM node component
├── types/
│   └── vm.ts                # TypeScript types
├── lib/
│   ├── predefined-machines.ts  # Machine templates
│   └── utils.ts             # Utility functions
├── terraform/
│   └── variables.tf         # Terraform variables
└── deployments/             # Generated deployments
```

## Contributing

Feel free to submit issues or pull requests!

## License

MIT
