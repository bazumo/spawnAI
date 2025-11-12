# Deployment Logging & Progress Reporting

## Overview

The deployment system now includes comprehensive console logging at every step to help track progress and debug issues.

## Client-Side Logging (Browser Console)

### VMNode Component
When a VM node is rendered, you'll see:
```
VMNode rendered: {
  id: "vm-123...",
  name: "My VM",
  hasOnDeploy: true,
  deploymentStatus: "pending",
  isDeployed: false
}
```

### Deploy Button Click
When you click the "Deploy VM" button:
```
🖱️ Deploy button clicked in VMNode for: vm-123...
🎬 Deploy button clicked for node: vm-123...
✅ UI updated to deploying status
📦 Node data: { id: "vm-123...", name: "My VM", ... }
🚀 Sending deployment request to /api/deploy...
```

### API Response
When the server responds:
```
📡 Response status: 200
📥 Response data: { success: true, vmId: "...", publicIp: "1.2.3.4", ... }
```

### Success Case
```
✅ Deployment successful!
🌐 Public IP: 1.2.3.4
🔑 SSH Key: vm-key-123
🎉 UI updated to deployed status
```

### Failure Case
```
❌ Deployment failed: Terraform deployment failed: ...
⚠️ UI updated to failed status
```

### Exception Case
```
❌ Deployment exception: Error: ...
⚠️ UI updated to failed status due to exception
```

## Server-Side Logging (Next.js Console)

### Deployment Start
```
🚀 Starting deployment for VM: My VM
📍 Region: us-east-1
💻 Instance Size: t3.small
📦 Application: vscode
```

### Directory & Key Setup
```
📁 Creating deployment directory: /path/to/deployments/deployment-vm-123-1234567890
🔑 Generating SSH key pair...
✅ SSH key generated successfully
```

### Terraform Configuration
```
📝 Generating Terraform configuration...
✅ main.tf created
✅ terraform.tfvars created
✅ setup.sh created
```

### Terraform Initialization
```
🔧 Initializing Terraform...
Terraform init output: [full terraform output]
✅ Terraform initialized
```

### Terraform Apply
```
🚀 Applying Terraform configuration (creating EC2 instance)...
⏳ This may take 1-2 minutes...
Terraform apply output: [full terraform output]
✅ Terraform apply complete
```

### Instance Details
```
📊 Getting instance details...
✅ Public IP: 54.123.45.67
```

### Instance Boot Wait
```
⏳ Waiting 30 seconds for instance to boot...
✅ Instance should be ready
```

### Application Installation
```
📦 Installing applications on the instance...
📤 Copying setup script to instance...
✅ Setup script copied
🔧 Running setup script on instance...
Setup script output: [output from setup.sh]
✅ Application setup complete
```

### Success Summary
```
🎉 Deployment complete!
📝 Summary:
  - VM ID: vm-123...
  - Public IP: 54.123.45.67
  - SSH Key: vm-key-123
  - Deployment Dir: /path/to/deployments/deployment-vm-123-1234567890
```

### Failure Cases
```
❌ SSH key generation error: [error details]
❌ Terraform error: [error details]
🧹 Attempting cleanup...
✅ Cleanup complete
```

or

```
❌ Setup script execution error: [error details]
⚠️ Instance created but application installation may have failed
```

## UI Progress Indicators

### Pending State
- Border: Regular black border
- Status: No status message
- Button: "Deploy VM" (enabled, black background)

### Deploying State
- Border: Gray border (thicker)
- Status: Blue box with:
  - Spinning loader icon
  - "Deployment in progress..."
  - Bullet points:
    • Creating EC2 instance with Terraform
    • This may take 1-2 minutes
    • Check console for detailed progress
- Button: "Deploying..." (disabled, gray background)

### Deployed State
- Border: Thick black border (4px)
- Status: Shows public IP and SSH key
- Button: Hidden (no longer needed)
- Icon: Green checkmark in header

### Failed State
- Border: Dashed black border
- Status: "✗ Deployment failed. Please try again."
- Button: "Deploy VM" (enabled again)
- Icon: Red X in header

## Debugging Tips

### If Deploy Button Does Nothing

1. Check browser console for:
   ```
   🖱️ Deploy button clicked in VMNode for: ...
   ```
   - If missing: Button click handler not firing
   - If present: Check next step

2. Check for:
   ```
   🎬 Deploy button clicked for node: ...
   ```
   - If missing: handleDeploy callback not wired up
   - If present: Check next step

3. Check for:
   ```
   🚀 Sending deployment request to /api/deploy...
   ```
   - If missing: Node data or fetch setup issue
   - If present: Check response

4. Check Next.js server console for:
   ```
   🚀 Starting deployment for VM: ...
   ```
   - If missing: API route not receiving request
   - If present: Follow server logs

### If Terraform Fails

Look for these error indicators:
- `❌ Terraform error:` - Check the error message
- Common issues:
  - Missing AWS credentials
  - Invalid region
  - Insufficient IAM permissions
  - Terraform not in PATH

### If Setup Script Fails

Look for:
- `❌ Setup script execution error:`
- Instance will be created but application won't be installed
- You can still SSH in and run setup manually

## Testing Deployment

To test with extensive logging:

1. Open browser console (F12)
2. Open terminal to view Next.js logs:
   ```bash
   cd spawnAI/webapp
   npm run dev
   ```
3. Drag a machine to the canvas or create one with AI
4. Click "Deploy VM"
5. Watch both consoles for progress

Expected timeline:
- 0s: Button clicked, UI updates
- 0-5s: API request sent, received
- 5-10s: Terraform init
- 10-90s: Terraform apply (EC2 creation)
- 90-120s: Instance boot wait
- 120-180s: Application installation
- 180s: Success!

## Accessing Deployed VMs

After successful deployment, the console will show:
```
✅ Deployment successful!
🌐 Public IP: 54.123.45.67
🔑 SSH Key: vm-key-vm-123-1234567890
```

To connect:
```bash
# Find the key path in server logs:
# Deployment Dir: /path/to/deployments/deployment-vm-123-1234567890

ssh -i /path/to/deployments/deployment-vm-123-1234567890/vm-key-vm-123-1234567890 ubuntu@54.123.45.67
```

For VS Code Server:
```
http://54.123.45.67:8080
# Default password: changeme
```

## Performance Notes

- Client logs: ~10-15 log statements per deployment
- Server logs: ~20-30 log statements per deployment
- All logs include emojis for easy visual scanning
- Terraform output is logged in full for debugging

## Security Note

⚠️ **Warning**: These logs may contain sensitive information:
- Public IP addresses
- SSH key names
- Deployment directory paths

In production:
- Consider redacting sensitive info from client logs
- Use proper log aggregation services
- Set appropriate log levels (info, debug, error)
- Don't expose Terraform output to client
