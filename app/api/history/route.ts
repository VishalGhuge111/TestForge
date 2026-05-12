import { NextRequest, NextResponse } from 'next/server';

// Note: History is stored client-side in localStorage via RequestHistoryManager
// This route is optional and can be used for server-side sync in the future
// For now, we keep it minimal

export async function GET(request: NextRequest) {
  // Client handles localStorage directly, but this route can be extended
  // for server-side sync or persistence in the future
  return NextResponse.json({
    message: 'Request history is stored client-side in localStorage',
    note: 'Use RequestHistoryManager utility for local history management',
  });
}

export async function DELETE(request: NextRequest) {
  // Client-side handling via RequestHistoryManager
  // This is a placeholder for potential server-side cleanup
  return NextResponse.json({
    success: true,
    message: 'Use client-side RequestHistoryManager to clear history',
  });
}
