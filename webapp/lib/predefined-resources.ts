import { Resource } from '@/types/vm';

export const predefinedResources: Resource[] = [
  {
    id: 'postgres-sales',
    name: 'Postgres DB Sales Data',
    type: 'database',
    description: 'Sales database with customer and transaction data',
  },
  {
    id: 'google-account',
    name: 'Google Account access',
    type: 'account',
    description: 'OAuth access to Google services',
  },
  {
    id: 'github-project',
    name: 'Github project',
    type: 'project',
    description: 'Repository access and project management',
  },
];
