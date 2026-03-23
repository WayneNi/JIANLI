import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { redirect } from 'next/navigation'
import { OptimizeClient } from './OptimizeClient'

export default async function OptimizePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = session.user

  return (
    <OptimizeClient
      initialCredits={user.credits}
      isLifetime={user.isLifetime}
      email={user.email}
    />
  )
}
