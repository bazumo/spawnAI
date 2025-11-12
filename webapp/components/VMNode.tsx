'use client';

import { memo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeData, AWSRegion, EC2InstanceSize, ApplicationType } from '@/types/vm';
import { Server, Trash2, Rocket, CheckCircle, XCircle, Loader2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRegionDisplayName, getRegionsWithDisplayNames } from '@/lib/regions';

const awsRegionsWithNames = getRegionsWithDisplayNames();

const ec2Sizes: EC2InstanceSize[] = [
  't2.micro',
  't2.small',
  't2.medium',
  't3.micro',
  't3.small',
  't3.medium',
  't3.large',
  'm5.large',
  'm5.xlarge',
  'c5.large',
  'c5.xlarge',
];

const applications: ApplicationType[] = ['none', 'vscode', 'claude-code', 'slate'];

interface VMNodeProps {
  data: any;
  id: string;
}

function VMNode({ data, id }: VMNodeProps) {
  const vmData = data as unknown as NodeData;
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);

  const statusMessages = ['Cooking...', 'Spawning...', 'Shelling...', 'Generating...'];

  // Debug log to verify component rendering
  console.log('VMNode rendered:', {
    id,
    name: vmData.name,
    hasOnDeploy: !!vmData.onDeploy,
    deploymentStatus: vmData.deploymentStatus,
    isDeployed: vmData.isDeployed
  });

  // Cycle through status messages when deploying
  useEffect(() => {
    if (vmData.deploymentStatus === 'deploying') {
      const interval = setInterval(() => {
        setStatusMessageIndex((prevIndex) => (prevIndex + 1) % statusMessages.length);
      }, 1500); // Change message every 1.5 seconds

      return () => clearInterval(interval);
    }
  }, [vmData.deploymentStatus, statusMessages.length]);

  const handleChange = (field: keyof NodeData, value: string) => {
    if (vmData.onChange) {
      vmData.onChange(id, { [field]: value });
    }
  };

  const getStatusIcon = () => {
    switch (vmData.deploymentStatus) {
      case 'deploying':
        return <Loader2 className="w-4 h-4 text-black animate-spin" />;
      case 'deployed':
        return <CheckCircle className="w-4 h-4 text-black" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-black" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (vmData.deploymentStatus) {
      case 'deploying':
        return 'border-2 border-gray-400 bg-white';
      case 'deployed':
        return 'border-4 border-black bg-white';
      case 'failed':
        return 'border-2 border-dashed border-black bg-white';
      default:
        return 'border border-black bg-white';
    }
  };

  const handleCopySshCommand = async () => {
    const sshCommand = typeof vmData.sshCommand === 'string' ? vmData.sshCommand : '';
    if (!sshCommand) {
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sshCommand);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = sshCommand;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy SSH command:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const copyStatusLabel = () => {
    switch (copyStatus) {
      case 'copied':
        return (
          <>
            <Check className="w-3 h-3" />
            Copied
          </>
        );
      case 'error':
        return 'Copy failed';
      default:
        return (
          <>
            <Copy className="w-3 h-3" />
            Copy
          </>
        );
    }
  };

  return (
    <div
      className={cn(
        'min-w-[320px] transition-all',
        getStatusColor()
      )}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-black" />

      {/* Header */}
      <div className="px-4 py-3 bg-black border-b border-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-white" />
            <h3 className="font-semibold text-white">{vmData.name}</h3>
            {getStatusIcon()}
          </div>
          {vmData.onDelete && (
            <button
              onClick={() => vmData.onDelete!(id)}
              className="p-1 hover:bg-gray-800 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-white hover:text-gray-300" />
            </button>
          )}
        </div>
      </div>

      {/* Configuration */}
      <div className="p-4 space-y-3">
        {/* Region */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">AWS Region</label>
          <select
            value={vmData.region}
            onChange={(e) => handleChange('region', e.target.value)}
            disabled={vmData.isDeployed}
            className="w-full px-3 py-2 bg-white border border-black text-sm text-black focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {awsRegionsWithNames.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* Instance Size */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Instance Size</label>
          <select
            value={vmData.instanceSize}
            onChange={(e) => handleChange('instanceSize', e.target.value)}
            disabled={vmData.isDeployed}
            className="w-full px-3 py-2 bg-white border border-black text-sm text-black focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ec2Sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Application */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Application</label>
          <select
            value={vmData.application}
            onChange={(e) => handleChange('application', e.target.value)}
            disabled={vmData.isDeployed}
            className="w-full px-3 py-2 bg-white border border-black text-sm text-black focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applications.map((app) => (
              <option key={app} value={app}>
                {app === 'none' ? 'No Application' : app}
              </option>
            ))}
          </select>
        </div>

        {/* Deployment Info */}
        {vmData.isDeployed && vmData.publicIp && (
          <div className="pt-2 border-t border-black">
            <p className="text-xs text-gray-600">Public IP:</p>
            <p className="text-sm font-mono text-black">{vmData.publicIp}</p>
            {vmData.sshKeyName && (
              <>
                <p className="text-xs text-gray-600 mt-2">SSH Key:</p>
                <p className="text-sm font-mono text-black">{vmData.sshKeyName}</p>
              </>
            )}
            {vmData.sshCommand && (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-600">SSH Command:</p>
                  <button
                    onClick={handleCopySshCommand}
                    className={cn(
                      'px-2 py-1 text-[11px] border border-black text-black flex items-center gap-1 transition-colors',
                      copyStatus === 'idle' ? 'bg-white hover:bg-gray-100' : 'bg-black text-white'
                    )}
                    type="button"
                  >
                    {copyStatusLabel()}
                  </button>
                </div>
                <div className="mt-1 text-[13px] font-mono text-black bg-gray-100 border border-gray-300 px-2 py-1 rounded overflow-x-auto whitespace-nowrap">
                  {vmData.sshCommand}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Message */}
        {vmData.deploymentStatus === 'failed' && (
          <div className="px-3 py-2 bg-white border border-black text-xs text-black">
            ✗ Deployment failed. Please try again.
          </div>
        )}

        {vmData.deploymentStatus === 'deploying' && (
          <div className="px-3 py-2 bg-blue-50 border border-blue-300 text-xs text-black space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{statusMessages[statusMessageIndex]}</span>
            </div>

          </div>
        )}

        {/* Deploy Button */}
        {vmData.onDeploy && !vmData.isDeployed && (
          <button
            onClick={() => {
              console.log('🖱️ Deploy button clicked in VMNode for:', id);
              vmData.onDeploy!(id);
            }}
            disabled={vmData.deploymentStatus === 'deploying'}
            className={cn(
              'w-full px-4 py-2 font-medium text-sm flex items-center justify-center gap-2 transition-colors border',
              vmData.deploymentStatus === 'deploying'
                ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                : 'bg-black text-white border-black hover:bg-gray-900'
            )}
          >
            {vmData.deploymentStatus === 'deploying' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Deploy VM
              </>
            )}
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-black" />
    </div>
  );
}

export default memo(VMNode);
