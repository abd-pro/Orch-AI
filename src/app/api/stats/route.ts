import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('feedbacks')
    .select('provider, category, rating')

  const byProvider: Record<string, { up: number; down: number }> = {}
  const byCategory: Record<string, { up: number; down: number }> = {}

  for (const row of data ?? []) {
    if (!byProvider[row.provider]) byProvider[row.provider] = { up: 0, down: 0 }
    if (!byCategory[row.category]) byCategory[row.category] = { up: 0, down: 0 }

    if (row.rating === 1) {
      byProvider[row.provider].up++
      byCategory[row.category].up++
    } else {
      byProvider[row.provider].down++
      byCategory[row.category].down++
    }
  }

  return NextResponse.json({ byProvider, byCategory, total: data?.length ?? 0 })
}
