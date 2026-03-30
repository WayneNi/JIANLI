# AI Resume Optimizer (ResumeCraft)

AI-powered resume optimization platform using the STAR method.

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: Vercel AI SDK, MiniMax API
- **PDF**: `@react-pdf/renderer` (generation), `pdfjs-dist` (parsing via subprocess)
- **Docx**: `mammoth` (parsing), `docx` (generation)
- **Auth**: NextAuth v4 with Prisma adapter
- **Database**: Prisma + PostgreSQL
- **Payments**: Stripe

## Getting Started

```bash
cd resume-optimizer
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Commands

```bash
pnpm dev      # Development server (http://localhost:3000)
pnpm build    # Production build
pnpm start    # Production server
pnpm lint     # ESLint check
pnpm test     # Run Vitest tests
pnpm test:ui  # Run tests with UI
```

## Environment Variables

```
MINIMAX_API_KEY=...
MINIMAX_GROUP_ID=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
DATABASE_URL=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

## Key Features

- **STAR Method Optimization**: Transform resume content using the STAR (Situation, Task, Action, Result) framework
- **PDF/Docx Parsing**: Upload and parse resumes in multiple formats
- **ATS Scoring**: Check resume compatibility with Applicant Tracking Systems
- **Streaming Responses**: Real-time AI optimization feedback
- **Credit System**: Pay-per-use credits for API calls

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── optimize/    # Core AI optimization endpoint (streaming)
│   │   ├── parse/       # PDF/Docx parsing
│   │   ├── credits/     # Credit management
│   │   ├── payments/    # Stripe checkout
│   │   └── webhooks/stripe/
│   ├── dashboard/
│   │   ├── optimize/    # Main optimization page
│   │   └── credits/
│   ├── auth/            # Sign in / register pages
│   └── pricing/
├── components/
│   ├── resume/          # Resume-related components
│   └── ui/              # shadcn/ui components
└── lib/
    ├── ai-prompts.ts    # All AI prompt templates
    ├── resume-optimizer.ts  # Core parsing/formatting logic
    ├── ats-checker.ts   # ATS scoring logic
    └── stripe.ts         # Stripe integration
```

## Adding UI Components

```bash
pnpm dlx shadcn-ui@latest add [component]
```
