import { PredefinedMachine } from '@/types/vm';

export const predefinedMachines: PredefinedMachine[] = [
  {
    id: 'vscode-large-eu-west',
    name: 'VSCode Machine',
    description: 'Good for development agents',
    region: 'eu-west-1',
    instanceSize: 't3.large',
    application: 'vscode',
  },
  {
    id: 'basic-micro-us-east',
    name: 'Claude machine',
    description: 'Small agent machine',
    region: 'us-east-1',
    instanceSize: 't2.micro',
    application: 'none',
  },
];
