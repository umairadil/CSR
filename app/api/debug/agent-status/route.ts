import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const agentStatuses = (global as any).getAgentStatus ? (global as any).getAgentStatus() : {};
    return NextResponse.json({
      success: true,
      agentStatuses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get agent status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


