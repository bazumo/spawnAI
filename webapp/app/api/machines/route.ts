import { NextRequest, NextResponse } from 'next/server';
import { getMachines, saveMachine } from '@/lib/storage';
import { VMConfiguration } from '@/types/vm';

// GET /api/machines - Get all machines
export async function GET() {
  try {
    const machines = await getMachines();
    return NextResponse.json({ success: true, machines });
  } catch (error) {
    console.error('Failed to get machines:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch machines' },
      { status: 500 }
    );
  }
}

// POST /api/machines - Create a new machine
export async function POST(request: NextRequest) {
  try {
    const machine: VMConfiguration = await request.json();

    // Validate required fields
    if (!machine.id || !machine.name || !machine.region || !machine.instanceSize) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const saved = await saveMachine(machine);
    return NextResponse.json({ success: true, machine: saved });
  } catch (error) {
    console.error('Failed to save machine:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save machine' },
      { status: 500 }
    );
  }
}
