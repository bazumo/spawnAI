export type AWSRegion =
  | 'us-west-1'
  | 'eu-central-1'
  | 'ap-northeast-1';

export type EC2InstanceSize =
  | 't2.micro'
  | 't2.small'
  | 't2.medium'
  | 't3.micro'
  | 't3.small'
  | 't3.medium'
  | 't3.large'
  | 'm5.large'
  | 'm5.xlarge'
  | 'c5.large'
  | 'c5.xlarge';

export type ApplicationType =
  | 'vscode'
  | 'claude-code'
  | 'slate'
  | 'none';

export interface VMConfiguration {
  id: string;
  name: string;
  region: AWSRegion;
  instanceSize: EC2InstanceSize;
  application: ApplicationType;
  isDeployed?: boolean;
  deploymentStatus?: 'pending' | 'deploying' | 'deployed' | 'failed';
  publicIp?: string;
  sshKeyName?: string;
  deploymentDir?: string;
  sshCommand?: string;
}

export interface PredefinedMachine {
  id: string;
  name: string;
  description: string;
  region: AWSRegion;
  instanceSize: EC2InstanceSize;
  application: ApplicationType;
}

export interface NodeData extends VMConfiguration {
  [key: string]: unknown;
  onDeploy?: (id: string) => void;
  onDelete?: (id: string) => void;
  onChange?: (id: string, config: Partial<VMConfiguration>) => void;
}

export interface DeploymentResponse {
  success: boolean;
  vmId: string;
  publicIp?: string;
  sshKeyName?: string;
  deploymentDir?: string;
  sshCommand?: string;
  error?: string;
}
