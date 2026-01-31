import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://35.212.144.149:5001';

export async function GET(request: NextRequest) {
  try {
    // Forward to backend
    const response = await fetch(`${BACKEND_URL}/api/cluster`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/cluster:', error);
    return NextResponse.json(
      { error: 'Failed to get cluster data' },
      { status: 500 }
    );
  }
}
