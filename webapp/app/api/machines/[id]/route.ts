import { NextRequest, NextResponse } from 'next/server';
import { getMachineById, updateMachine, deleteMachine } from '@/lib/storage';
import { VMConfiguration } from '@/types/vm';

// GET /api/machines/:id - Get a single machine
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const machine = await getMachineById(id);

    if (!machine) {
      return NextResponse.json(
        { success: false, error: 'Machine not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, machine });
  } catch (error) {
    console.error('Failed to get machine:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch machine' },
      { status: 500 }
    );
  }
}

// PATCH /api/machines/:id - Update a machine
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates: Partial<VMConfiguration> = await request.json();

    const updated = await updateMachine(id, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Machine not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, machine: updated });
  } catch (error) {
    console.error('Failed to update machine:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update machine' },
      { status: 500 }
    );
  }
}

// DELETE /api/machines/:id - Delete a machine
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteMachine(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Machine not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete machine:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete machine' },
      { status: 500 }
    );
  }
}
