import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Called by Vercel cron every 5 minutes to keep function warm
// Add to vercel.json: { "crons": [{ "path": "/api/warmup", "schedule": "*/5 * * * *" }] }
export async function GET() {
  return NextResponse.json({ 
    status: 'warm', 
    timestamp: new Date().toISOString(),
    service: "Shipra's AI Representative"
  })
}
