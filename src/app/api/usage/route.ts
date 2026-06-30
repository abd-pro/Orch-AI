import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PLANS, type UserPlan } from '@/lib/types'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const supabase = await createClient()
  // Auth : le mobile envoie un Bearer token ; le web utilise les cookies SSR
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const { data: { user } } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser()
  const service = await createServiceClient()

  // Admin / dev
  const adminEmail = process.env.ADMIN_EMAIL
  if (user && adminEmail && user.email === adminEmail) {
    const config = PLANS.dev
    return NextResponse.json({ plan: 'dev', remaining: Infinity, limit: Infinity, maxAIs: config.maxAIs, allowedAIs: config.allowedAIs, label: config.label })
  }

  // Visiteur anonyme
  if (!user) {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? headersList.get('x-real-ip') ?? 'unknown'
    const identifier = `anon:${ip}`
    const config = PLANS.visitor
    const { data } = await service.from('daily_usage').select('count').eq('identifier', identifier).eq('date', 'lifetime').single()
    const used = data?.count ?? 0
    return NextResponse.json({
      plan: 'visitor',
      remaining: Math.max(0, config.credits - used),
      limit: config.credits,
      maxAIs: config.maxAIs,
      allowedAIs: config.allowedAIs,
      label: config.label,
    })
  }

  // Utilisateur connecté
  const { data: profile } = await service.from('profiles').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan as UserPlan | undefined) ?? 'free'
  const validPlan: UserPlan = plan in PLANS ? plan : 'free'
  const config = PLANS[validPlan]

  if (config.credits === Infinity) {
    return NextResponse.json({
      plan: validPlan,
      remaining: Infinity,
      limit: Infinity,
      maxAIs: config.maxAIs,
      allowedAIs: config.allowedAIs,
      label: config.label,
    })
  }

  const yearMonth = new Date().toISOString().slice(0, 7)
  const { data } = await service.from('daily_usage').select('count').eq('identifier', user.id).eq('date', yearMonth).single()
  const used = data?.count ?? 0

  return NextResponse.json({
    plan: validPlan,
    remaining: Math.max(0, config.credits - used),
    limit: config.credits,
    maxAIs: config.maxAIs,
    allowedAIs: config.allowedAIs,
    label: config.label,
  })
}
