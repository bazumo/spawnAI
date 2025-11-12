# Data Layer

Quick hackathon implementation using JSON file storage.

## Storage Functions (`storage.ts`)

Server-side functions for persisting VM configurations:

```typescript
// Get all machines
const machines = await getMachines();

// Get single machine
const machine = await getMachineById('vm-123');

// Save new machine
const saved = await saveMachine(vmConfig);

// Update existing machine
const updated = await updateMachine('vm-123', { region: 'us-west-2' });

// Delete machine
await deleteMachine('vm-123');

// Query by status
const deploying = await getMachinesByStatus('deploying');

// Query by region
const usEast = await getMachinesByRegion('us-east-1');
```

## API Client (`api-client.ts`)

Client-side functions for calling API endpoints:

```typescript
// Fetch all machines
const machines = await fetchMachines();

// Fetch single machine
const machine = await fetchMachine('vm-123');

// Create new machine
const created = await createMachine(vmConfig);

// Update machine
const updated = await updateMachineConfig('vm-123', { instanceSize: 't3.large' });

// Delete machine
await deleteMachineById('vm-123');
```

## API Routes

### `POST /api/machines`
Create a new machine
```json
{
  "id": "vm-123",
  "name": "My VM",
  "region": "us-east-1",
  "instanceSize": "t3.small",
  "application": "vscode"
}
```

### `GET /api/machines`
Get all machines

### `GET /api/machines/:id`
Get a single machine

### `PATCH /api/machines/:id`
Update a machine
```json
{
  "region": "us-west-2",
  "instanceSize": "t3.medium"
}
```

### `DELETE /api/machines/:id`
Delete a machine

## Data Storage

Machines are stored in `/data/machines.json`:

```json
[
  {
    "id": "vm-1234567890",
    "name": "My Development VM",
    "region": "us-east-1",
    "instanceSize": "t3.small",
    "application": "vscode",
    "isDeployed": false,
    "deploymentStatus": "pending"
  }
]
```

## Implementation Notes

- **Hackathon Quick & Dirty**: This uses simple JSON file storage
- **Production**: Replace with PostgreSQL, MongoDB, or any real database
- **Concurrency**: No locking - multiple writes could conflict
- **Persistence**: All data stored locally in `/data` directory
- **Backup**: Just copy the JSON file

## Upgrading to Production

To replace with a real database:

1. Update `storage.ts` to use your database client
2. Keep the same function signatures
3. API routes don't need to change
4. Client code doesn't need to change

Example with Prisma:
```typescript
export async function getMachines() {
  return await prisma.vmConfiguration.findMany();
}
```
