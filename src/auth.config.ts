import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import type { SubscriptionTier } from '@/generated/prisma'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      subscriptionTier: SubscriptionTier
      usageCount: number
      resetDate: Date
    }
  }
  interface User {
    subscriptionTier?: SubscriptionTier
    usageCount?: number
    resetDate?: Date
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    subscriptionTier: SubscriptionTier
    usageCount: number
    resetDate: Date
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // 邮箱密码登录
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('请输入邮箱和密码')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) {
          throw new Error('用户不存在，请先注册')
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          throw new Error('密码错误')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          subscriptionTier: user.subscriptionTier,
          usageCount: user.usageCount,
          resetDate: user.resetDate
        }
      }
    }),
    // Google 第三方登录
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.subscriptionTier = user.subscriptionTier ?? 'FREE'
        token.usageCount = user.usageCount ?? 0
        token.resetDate = user.resetDate ?? new Date()
      }

      // 处理会话更新（如用户修改了订阅）
      if (trigger === 'update' && session) {
        token.subscriptionTier = session.subscriptionTier
        token.usageCount = session.usageCount
      }

      return token
    },
    async session({ session, token }) {
      // 从数据库获取最新用户数据
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id }
      })

      if (dbUser) {
        // 检查是否需要重置配额（月度重置）
        const now = new Date()
        const resetDate = new Date(dbUser.resetDate)
        const isNewMonth = now.getMonth() !== resetDate.getMonth() ||
                           now.getFullYear() !== resetDate.getFullYear()

        if (isNewMonth && dbUser.subscriptionTier === 'FREE') {
          // 重置免费用户配额
          await prisma.user.update({
            where: { id: token.id },
            data: {
              usageCount: 0,
              resetDate: now
            }
          })
        }

        session.user = {
          id: token.id,
          email: dbUser.email,
          name: dbUser.name,
          image: dbUser.image,
          subscriptionTier: dbUser.subscriptionTier,
          usageCount: isNewMonth && dbUser.subscriptionTier === 'FREE' ? 0 : dbUser.usageCount,
          resetDate: isNewMonth ? now : dbUser.resetDate
        }
      }

      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
}
