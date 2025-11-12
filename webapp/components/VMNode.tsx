'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeData, AWSRegion, EC2InstanceSize, ApplicationType } from '@/types/vm';
import { Server, Trash2, Rocket, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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

const applications: ApplicationType[] = ['none', 'vscode', 'claude-code'];

interface VMNodeProps {
  data: any;
  id: string;
}

function VMNode({ data, id }: VMNodeProps) {
  const vmData = data as unknown as NodeData;

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

  return (
    <div
      className={cn(
        'min-w-[320px] transition-all',
        getStatusColor()
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-black" />

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
          </div>
        )}

        {/* Status Message */}
        {vmData.deploymentStatus === 'failed' && (
          <div className="px-3 py-2 bg-white border border-black text-xs text-black">
            ✗ Deployment failed. Please try again.
          </div>
        )}

        {vmData.deploymentStatus === 'deploying' && (
          <div className="px-3 py-2 bg-gray-100 border border-gray-400 text-xs text-black">
            ⋯ Deploying VM and installing software...
          </div>
        )}

        {/* Deploy Button */}
        {vmData.onDeploy && !vmData.isDeployed && (
          <button
            onClick={() => vmData.onDeploy!(id)}
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

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-black" />
    </div>
  );
}

export default memo(VMNode);
