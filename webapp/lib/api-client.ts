import { VMConfiguration } from '@/types/vm';

// Get all machines
export async function fetchMachines(): Promise<VMConfiguration[]> {
  const response = await fetch('/api/machines');
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch machines');
  }

  return data.machines;
}

// Get a single machine
export async function fetchMachine(id: string): Promise<VMConfiguration> {
  const response = await fetch(`/api/machines/${id}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch machine');
  }

  return data.machine;
}

// Create a new machine
export async function createMachine(machine: VMConfiguration): Promise<VMConfiguration> {
  const response = await fetch('/api/machines', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(machine),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to create machine');
  }

  return data.machine;
}

// Update a machine
export async function updateMachineConfig(
  id: string,
  updates: Partial<VMConfiguration>
): Promise<VMConfiguration> {
  const response = await fetch(`/api/machines/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to update machine');
  }

  return data.machine;
}

// Delete a machine
export async function deleteMachineById(id: string): Promise<void> {
  const response = await fetch(`/api/machines/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to delete machine');
  }
}
