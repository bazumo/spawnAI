import { VMConfiguration } from '@/types/vm';
import * as fs from 'fs/promises';
import * as path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'data');
const MACHINES_FILE = path.join(STORAGE_DIR, 'machines.json');

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create storage directory:', error);
  }
}

// Ensure machines file exists
async function ensureMachinesFile() {
  await ensureStorageDir();
  try {
    await fs.access(MACHINES_FILE);
  } catch {
    await fs.writeFile(MACHINES_FILE, JSON.stringify([], null, 2));
  }
}

// Get all machines
export async function getMachines(): Promise<VMConfiguration[]> {
  await ensureMachinesFile();
  try {
    const data = await fs.readFile(MACHINES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read machines:', error);
    return [];
  }
}

// Get a single machine by ID
export async function getMachineById(id: string): Promise<VMConfiguration | null> {
  const machines = await getMachines();
  return machines.find(m => m.id === id) || null;
}

// Save a new machine
export async function saveMachine(machine: VMConfiguration): Promise<VMConfiguration> {
  const machines = await getMachines();
  machines.push(machine);
  await fs.writeFile(MACHINES_FILE, JSON.stringify(machines, null, 2));
  return machine;
}

// Update an existing machine
export async function updateMachine(id: string, updates: Partial<VMConfiguration>): Promise<VMConfiguration | null> {
  const machines = await getMachines();
  const index = machines.findIndex(m => m.id === id);

  if (index === -1) {
    return null;
  }

  machines[index] = { ...machines[index], ...updates };
  await fs.writeFile(MACHINES_FILE, JSON.stringify(machines, null, 2));
  return machines[index];
}

// Delete a machine
export async function deleteMachine(id: string): Promise<boolean> {
  const machines = await getMachines();
  const filtered = machines.filter(m => m.id !== id);

  if (filtered.length === machines.length) {
    return false; // Machine not found
  }

  await fs.writeFile(MACHINES_FILE, JSON.stringify(filtered, null, 2));
  return true;
}

// Get machines by status
export async function getMachinesByStatus(status: VMConfiguration['deploymentStatus']): Promise<VMConfiguration[]> {
  const machines = await getMachines();
  return machines.filter(m => m.deploymentStatus === status);
}

// Get machines by region
export async function getMachinesByRegion(region: string): Promise<VMConfiguration[]> {
  const machines = await getMachines();
  return machines.filter(m => m.region === region);
}

// Clear all machines (useful for testing)
export async function clearAllMachines(): Promise<void> {
  await ensureStorageDir();
  await fs.writeFile(MACHINES_FILE, JSON.stringify([], null, 2));
}
