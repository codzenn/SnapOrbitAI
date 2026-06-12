# SnapOrbitAI

SnapOrbitAI is an AI content studio for creators, marketers, and teams who work with images, videos, and social-ready media assets. It combines upload management, AI image enhancement, video intelligence, semantic search, subscriptions, and usage analytics in one full-stack Next.js application.

The product is designed for a modern media workflow: upload content, clean it up, generate captions, analyze quality, repurpose formats, search by meaning, and manage paid access from the same workspace.

## Highlights

- AI-powered image captions and hashtag ideas for social platforms
- Background removal and generative image expansion through Cloudinary
- Quality audits for composition, brightness, blur, and platform fit
- Semantic asset search using Gemini embeddings
- Batch image workflows with ZIP export
- Video analysis with summaries, scenes, topics, mood, audio detection, and key quotes
- Video captions, compression, and aspect-ratio conversion
- Clerk authentication for protected user workspaces
- Razorpay Subscriptions with Free, Pro, and Business plans priced for India
- Prisma/PostgreSQL persistence for assets, trials, and subscriptions
- Analytics dashboard for Business usage visibility

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, lucide-react, Base UI, Radix Slot |
| Auth | Clerk |
| Media | Cloudinary, next-cloudinary |
| AI | Google Gemini |
| Database | PostgreSQL, Prisma 7 |
| Billing | Razorpay |
| Testing | Vitest, Testing Library |
| Charts | Recharts |

## Product Areas

### Public Website

- Dark landing page for the AI content studio brand
- Social-media-focused favicon and shared brand mark
- Feature, workflow, and pricing sections
- Standalone pricing page with plan selection

### Authenticated Workspace

- Asset library for images and videos
- Upload studio for content ingestion
- Background removal workflow
- Generative fill and expansion workflow
- Batch processor for repeated image operations
- Video Studio for analysis, captions, compression, and conversion
- Analytics dashboard
- Profile and subscription management

### API Surface

- `POST /api/image-upload`
- `GET /api/videos`
- `POST /api/videos/upload`
- `POST /api/ai/captions`
- `POST /api/ai/audit`
- `POST /api/search`
- `POST /api/transform/bg-remove`
- `POST /api/transform/gen-fill`
- `POST /api/batch`
- `POST /api/video/analyze`
- `POST /api/video/captions`
- `POST /api/video/convert`
- `GET /api/subscription/current`
- `POST /api/razorpay/create-subscription`
- `POST /api/razorpay/verify`
- `POST /api/razorpay/webhook`
- `POST /api/auth/auto-logout`

## Plans and Access

SnapOrbitAI uses Prisma as the source of truth for subscription state.

| Plan | Intended User | Notes |
| --- | --- | --- |
| Free | New users testing the workflow | Limited trials per feature and 5 stored assets |
| Pro | Solo creators and marketers | Higher asset limit and recurring AI usage |
| Business | Teams and high-volume users | Unlimited-style workflows, analytics, and higher batch limits |

Free trial usage is tracked in the `TrialUsage` model. Razorpay plan IDs are configured through environment variables, and each checkout creates a Razorpay subscription for the selected monthly or yearly plan.

## Project Structure

```text
app/
  (app)/                 Authenticated workspace routes
  (auth)/                Clerk auth pages and recovery flows
  api/                   Route handlers for AI, media, billing, and auth
  pricing/               Standalone pricing page
  favicon.ico            Browser favicon
  favicon-source.svg     Editable favicon source
  page.tsx               Landing page

components/
  ai/                    Caption, audit, and search UI
  analytics/             Usage dashboard
  auth/                  Auth form helpers
  batch/                 Batch-processing UI
  landing/               Landing page sections
  media/                 Asset detail and comparison UI
  ui/                    Shared UI primitives
  video/                 Video Studio panels
  BrandMark.tsx          Shared SnapOrbitAI logo mark

lib/
  ai.ts                  Gemini model setup
  cloudinary.ts          Cloudinary URL helpers
  embeddings.ts          Semantic search utilities
  media-ai.ts            AI parsing helpers
  prisma.ts              Prisma client
  razorpay.ts            Razorpay plans, API calls, and signature checks
  trial.ts               Plan and trial access logic

prisma/
  schema.prisma          Video, TrialUsage, and Subscription models
  migrations/            Database migrations

__tests__/
  api/                   API route tests
  auth/                  Auth helper tests
```

## Data Model

| Model | Purpose |
| --- | --- |
| `Video` | Stores uploaded image/video assets, Cloudinary IDs, AI metadata, quality scores, captions, embeddings, and video analysis fields |
| `TrialUsage` | Tracks limited free usage by user and feature |
| `Subscription` | Stores Razorpay plan, subscription, customer, and payment metadata with plan status and renewal period |

Prisma Client is generated into `generated/prisma`.

## Environment Variables

Create `.env.local` for local development. Do not commit secrets.

```env
DATABASE_URL=

NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GOOGLE_GENERATIVE_AI_API_KEY=
GEMINI_VISION_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_PRO_MONTHLY_PLAN_ID=
RAZORPAY_PRO_YEARLY_PLAN_ID=
RAZORPAY_BUSINESS_MONTHLY_PLAN_ID=
RAZORPAY_BUSINESS_YEARLY_PLAN_ID=
```

## Local Development

### Prerequisites

- Node.js 20 or newer
- PostgreSQL database
- Clerk application
- Cloudinary account
- Google AI API key
- Razorpay account for billing flows

### Install Dependencies

```bash
npm install
```

### Prepare the Database

```bash
npx prisma generate
npx prisma migrate dev
```

### Run the App

```bash
npm run dev
```

Open `http://localhost:3000`.

### Useful Scripts

```bash
npm run dev      # Start the local Next.js dev server
npm run build    # Build for production
npm run start    # Start the production server
npm run lint     # Run ESLint
npm run test     # Run Vitest tests
```

### Type Check

```bash
npx tsc --noEmit
```

## Razorpay Webhooks

For local webhook testing, forward Razorpay subscription events to:

```text
http://localhost:3000/api/razorpay/webhook
```

For production:

```text
https://your-domain.com/api/razorpay/webhook
```

Set the resulting webhook signing secret as `RAZORPAY_WEBHOOK_SECRET`.

Recommended events:

```text
subscription.authenticated
subscription.activated
subscription.charged
subscription.pending
subscription.halted
subscription.paused
subscription.resumed
subscription.cancelled
subscription.completed
```

## Deployment

This app should be deployed as a full Node.js web application with PostgreSQL. It is not a static site.

Recommended hosting options:

- Railway
- Render
- Fly.io
- DigitalOcean App Platform
- AWS App Runner or ECS
- Azure Container Apps

Production deployment checklist:

1. Provision PostgreSQL.
2. Set all required environment variables.
3. Run `npm install`.
4. Run `npx prisma generate`.
5. Run `npm run build`.
6. Run `npx prisma migrate deploy`.
7. Start with `npm run start`.
8. Configure Clerk production URLs.
9. Configure Cloudinary credentials and upload limits.
10. Configure Razorpay live API keys, subscription plan IDs, and webhook endpoint.
11. Confirm Gemini API access and billing readiness.

## Contributor Notes

This project uses Next.js 16. Before changing framework APIs, routing conventions, metadata, or file conventions, read the relevant local documentation in:

```text
node_modules/next/dist/docs/
```

Useful docs for this codebase:

- `01-app/01-getting-started/03-layouts-and-pages.md`
- `01-app/01-getting-started/11-css.md`
- `01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md`

## Quality Notes

- API behavior is covered by focused Vitest tests.
- Auth helper behavior has dedicated tests.
- Media and AI flows should be tested with real provider credentials before production launch.
- Razorpay subscription behavior should be validated with test-mode subscription checkout and webhook events.

## Branding

The current brand mark is a social-media content card with a play button and share nodes. It is implemented in:

- `components/BrandMark.tsx`
- `app/favicon-source.svg`
- `app/favicon.ico`

Regenerate `app/favicon.ico` from `app/favicon-source.svg` if the mark changes.

## License

No license has been selected yet. Add a license before making the repository public.
