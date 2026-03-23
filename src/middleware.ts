import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // 获取当前路径
    const path = req.nextUrl.pathname

    // 如果用户已登录且访问 auth 相关页面，重定向到首页
    if (path.startsWith('/auth') && req.nextauth.token) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // 只有匹配这些条件的请求才会经过 middleware
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // 保护这些路由
        const protectedPaths = [
          '/dashboard',
          '/settings',
          '/api/user',
          '/api/payments',
          '/api/credits',
        ]
        const isProtectedPath = protectedPaths.some(p => path.startsWith(p))

        // 如果是受保护的路径但没有 token
        if (isProtectedPath && !token) {
          return false
        }

        return true
      }
    }
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/user/:path*',
    '/api/payments/:path*',
    '/api/credits/:path*',
  ]
}
