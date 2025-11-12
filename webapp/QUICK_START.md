# Quick Start Guide

## Prerequisites

Before deploying VMs, make sure you have:

### 1. AWS Credentials
```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
```

### 2. Anthropic API Key (for AI machine selection)
```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key"
```

### 3. Verify Terraform Installation
```bash
terraform version
# Should output: Terraform v1.9.8 (or similar)
```

## Running the Application

### Development Mode
```bash
cd spawnAI/webapp
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Mode
```bash
npm run build
npm start
```

## Testing Deployment

### Method 1: Drag & Drop
1. Open the app in your browser
2. Look at the left sidebar for "Predefined Machines"
3. Drag a machine (e.g., "VSCode Machine") to the canvas
4. Click the "Deploy VM" button on the node
5. Watch the console for progress (F12)

### Method 2: AI-Powered Creation
1. Look for the "Create Custom" section in the sidebar
2. Type a request like:
   - "I need a development machine in Tokyo"
   - "Create a VS Code server in Frankfurt"
   - "Small agent machine in San Francisco"
3. Click "Generate Machine"
4. AI will select the best predefined machine
5. Machine appears on canvas, click "Deploy VM"

## What to Expect

### Timeline
- **0-5s**: Request sent, Terraform setup
- **5-10s**: Terraform initialization
- **10-90s**: EC2 instance creation
- **90-120s**: Waiting for instance to boot
- **120-180s**: Installing applications
- **Total**: ~2-3 minutes for complete deployment

### Console Output (Browser)
```
🖱️ Deploy button clicked in VMNode for: vm-...
🎬 Deploy button clicked for node: vm-...
✅ UI updated to deploying status
🚀 Sending deployment request to /api/deploy...
📡 Response status: 200
✅ Deployment successful!
🌐 Public IP: 54.123.45.67
```

### Console Output (Server)
```
🚀 Starting deployment for VM: My VM
📍 Region: us-east-1
💻 Instance Size: t3.small
📦 Application: vscode
🔑 Generating SSH key pair...
✅ SSH key generated successfully
🔧 Initializing Terraform...
🚀 Applying Terraform configuration...
✅ Terraform apply complete
🌐 Public IP: 54.123.45.67
🎉 Deployment complete!
```

### UI Changes
1. **Deploying**:
   - Node border turns gray
   - Blue status box appears
   - Spinner animation
   - Button disabled

2. **Success**:
   - Thick black border (4px)
   - Green checkmark icon
   - Shows public IP and SSH key
   - Button disappears

3. **Failed**:
   - Dashed border
   - Red X icon
   - Error message
   - Button re-enabled for retry

## Accessing Your Deployed VM

### SSH Access
After deployment completes, check the server console for the deployment directory:
```
Deployment Dir: /path/to/deployments/deployment-vm-123-1234567890
```

Connect via SSH:
```bash
ssh -i /path/to/deployments/deployment-vm-123-1234567890/vm-key-vm-123-1234567890 ubuntu@<public-ip>
```

### VS Code Server
If you deployed a VS Code machine:
```
Open: http://<public-ip>:8080
Password: changeme
```

⚠️ **Change the password after first login!**

### Claude Code
If you deployed a Claude Code machine:
```bash
ssh into the machine
./start-claude-code.sh
```

## Troubleshooting

### "Deploy button does nothing"
1. Open browser console (F12)
2. Click the button again
3. Look for error messages
4. Check if you see: `🖱️ Deploy button clicked`
   - If yes: Check server logs
   - If no: Refresh the page and try again

### "Terraform command not found"
```bash
# Verify installation
which terraform
# Should output: /usr/local/bin/terraform

# If not installed, reinstall:
cd /tmp
wget https://releases.hashicorp.com/terraform/1.9.8/terraform_1.9.8_linux_amd64.zip
sudo unzip -o terraform_1.9.8_linux_amd64.zip -d /usr/local/bin/
terraform version
```

### "No valid credential sources found"
Your AWS credentials aren't configured. Set them:
```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
```

Or configure AWS CLI:
```bash
aws configure
```

### "Deployment failed after 2 minutes"
Common causes:
1. **AWS Quota**: You might have hit EC2 instance limits
2. **IAM Permissions**: Check your AWS user has EC2 permissions
3. **Region Issues**: Try a different region
4. **Network**: Check your internet connection

Check server logs for specific Terraform errors.

### "Instance created but can't SSH"
1. Wait an extra minute (instance might still be booting)
2. Check security group allows your IP
3. Verify the key file permissions:
   ```bash
   chmod 600 /path/to/key-file
   ```

## Cost Management

### Deployed Instances Cost Money!
- t2.micro: ~$0.0116/hour (~$8.50/month)
- t3.small: ~$0.0208/hour (~$15/month)
- t3.large: ~$0.0832/hour (~$60/month)

### Cleaning Up
To destroy a deployment:
```bash
cd /path/to/deployments/deployment-vm-123-1234567890
terraform destroy -auto-approve
```

Or via AWS Console:
1. Go to EC2 Dashboard
2. Find your instance (tagged with your VM name)
3. Terminate it

## Demo Scenario

Want to show off the system? Here's a complete demo flow:

1. **Start the app**:
   ```bash
   npm run dev
   ```

2. **Open two windows**:
   - Browser: http://localhost:3000
   - Terminal: Watch the server logs

3. **Create with AI**:
   - Type: "I need a VS Code development server in Tokyo"
   - Click "Generate Machine"
   - Watch AI select the best configuration

4. **Deploy**:
   - Drag the generated machine to canvas
   - Click "Deploy VM"
   - Show both console outputs updating in real-time

5. **Success**:
   - Point out the public IP in the node
   - SSH into the machine (optional)
   - Open VS Code Server in browser (if deployed)

6. **Cleanup** (optional):
   - Show the terraform destroy command
   - Or just leave it for later manual cleanup

## Next Steps

After your first successful deployment:
- Try different regions (San Francisco, Frankfurt)
- Try different applications (VS Code, Claude Code)
- Experiment with AI prompts
- Check AWS console to see your instances
- Modify predefined machines in [lib/predefined-machines.ts](lib/predefined-machines.ts)

## Support

For issues:
1. Check [DEPLOYMENT_LOGGING.md](DEPLOYMENT_LOGGING.md) for debugging
2. Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup
3. Review console logs (both browser and server)
4. Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for architecture

## Security Reminders

🔒 **Before going to production**:
- [ ] Add authentication to `/api/deploy`
- [ ] Implement rate limiting
- [ ] Restrict security groups to specific IPs
- [ ] Change VS Code default password
- [ ] Use AWS IAM roles instead of access keys
- [ ] Add deployment cleanup from UI
- [ ] Implement proper secrets management
- [ ] Add audit logging

Happy deploying! 🚀
