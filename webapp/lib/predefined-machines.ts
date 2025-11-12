import { PredefinedMachine } from '@/types/vm';

export const predefinedMachines: PredefinedMachine[] = [
  {
    id: 'vscode-large-us-west',
    name: 'VSCode Machine',
    description: 'Good for development agents',
    region: 'us-west-1',
    instanceSize: 't3.large',
    application: 'vscode',
  },
  {
    id: 'basic-micro-us-west',
    name: 'Claude machine',
    description: 'Small agent machine',
    region: 'us-west-1',
    instanceSize: 't2.micro',
    application: 'none',
  },
  { 
    id: 'personal-agent-us-west',
    name: 'Personal Agent machine',
    description: 'Low spec machine for personal agent',
    region: 'us-west-1',
    instanceSize: 't2.micro',
    application: 'none',
  },
  { 
    id: 'slate-us-west',
    name: 'Slate dev agent',
    description: 'High spec machine for Slate dev agent',
    region: 'us-west-1',
    instanceSize: 'm5.large',
    application: 'slate',
  },
];
