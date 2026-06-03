import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let conversations: { id: string; title: string }[] = []
  if (user) {
    const { data } = await supabase
      .from('conversations')
      .select('id, title')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(30)
    conversations = data ?? []
  }

  const adminEmail = process.env.ADMIN_EMAIL
  const isAdmin = !!(user && adminEmail && user.email === adminEmail)

  return (
    <DashboardShell user={user} conversations={conversations} isAdmin={isAdmin}>
      {children}
    </DashboardShell>
  )
}
