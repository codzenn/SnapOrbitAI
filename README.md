# SnapOrbitAI

SnapOrbitAI is a production-ready AI media workspace for creators, marketers, and teams. It combines Cloudinary media delivery, Gemini-powered image and video intelligence, Clerk authentication, Stripe billing, and Prisma/PostgreSQL persistence inside a single Next.js application.

## What It Does

SnapOrbitAI helps users upload, organize, enhance, analyze, and repurpose media assets through AI-assisted workflows.

### Image workflows

- Asset library with search and filtering
- Natural-language semantic search
- AI-generated captions for social platforms
- AI quality audit
- Background removal
- Generative fill / image expansion
- Batch processing for repeated image operations

### Video workflows

- AI video analysis with summary, scene timeline, mood, topics, and key quotes
- Audio-aware video caption generation
- Video compression to delivery-ready formats
- Landscape-to-portrait video conversion for short-form platforms

### Business workflows

- Usage analytics dashboard
- Stripe-powered subscription management
- Feature trial gating for free users

## Product Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS`
- `Clerk`
- `Cloudinary`
- `Google Gemini`
- `Prisma`
- `PostgreSQL`
- `Stripe`
- `Vitest`

## Core Architecture

- `app/`: App Router pages and API routes
- `components/`: UI, media, AI, analytics, and video components
- `lib/`: AI helpers, Cloudinary helpers, Prisma client, Stripe helpers, and trial logic
- `prisma/`: schema and migrations
- `__tests__/`: focused API and auth tests

## Main Routes

### App routes

- `/home`: Asset library
- `/video-upload`: Single image upload workflow
- `/video-studio`: Video upload, analysis, captions, and conversion
- `/ai-bg-removal`: Background removal
- `/ai-gen-expand`: Generative fill
- `/batch-process`: Batch image operations
- `/analytics`: Business analytics dashboard
- `/profile`: Account and subscription profile
- `/pricing`: Subscription plans

### API routes

- `/api/image-upload`
- `/api/videos`
- `/api/videos/upload`
- `/api/video/analyze`
- `/api/video/captions`
- `/api/video/convert`
- `/api/ai/captions`
- `/api/ai/audit`
- `/api/search`
- `/api/batch`
- `/api/subscription/current`
- `/api/stripe/checkout`
- `/api/stripe/confirm`
- `/api/stripe/portal`
- `/api/stripe/webhook`

## Environment Variables

Create `.env.local` with the following values:

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

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_YEARLY_PRICE_ID=
STRIPE_BUSINESS_MONTHLY_PRICE_ID=
STRIPE_BUSINESS_YEARLY_PRICE_ID=
```

## Local Development

### Install

```bash
npm install
```

### Database

```bash
npx prisma migrate dev
npx prisma generate
```

### Run

```bash
npm run dev
```

### Quality checks

```bash
npm run lint
npm run test
npx tsc --noEmit
```

## Production Deployment

This project should be deployed as a full Node.js web application with PostgreSQL, not as a static site.

### Recommended host

**Best practical choice:** `Railway`

Why Railway is a strong fit for this project:

- Supports full `Next.js` server deployments
- Works well with `PostgreSQL` and `Prisma`
- Handles environment variables cleanly
- Good fit for Stripe webhooks and server routes
- Better suited than hobby-style serverless setups for buffered media uploads and longer AI requests

### Other professional options

- `Render`: solid managed web service + Postgres setup
- `Fly.io`: best if you want more control over runtime behavior
- `DigitalOcean App Platform`: good if you already use DigitalOcean services
- `AWS ECS / App Runner`, `Azure Container Apps`, or a VPS: best for full infrastructure control

### Not ideal for this project

- Static-only hosting
- Edge-only hosting
- Platforms with very small request-body or execution-time limits

This project includes:

- file uploads proxied through the app
- Stripe webhooks
- Prisma database access
- Cloudinary server uploads
- Gemini video analysis requests that can take longer than typical short serverless invocations

## Railway Deployment Checklist

### 1. Create infrastructure

- Create a new Railway project
- Add a PostgreSQL service
- Add a web service for this repo

### 2. Configure build and start

Use the default Node build flow or equivalent commands:

```bash
npm install
npx prisma generate
npm run build
npm run start
```

### 3. Run migrations

On deploy, run:

```bash
npx prisma migrate deploy
```

### 4. Set environment variables

Add all variables from the `Environment Variables` section.

### 5. Configure third-party dashboards

#### Clerk

- Add your production domain
- Set sign-in and sign-up URLs
- Confirm redirect URLs point to your live app

#### Stripe

- Create live products and prices
- Set live price IDs in env vars
- Point the live webhook to:

```text
https://your-domain.com/api/stripe/webhook
```

#### Cloudinary

- Verify upload limits and credentials
- Confirm the cloud name matches the delivery account you want to use

#### Gemini

- Use a valid production API key with billing enabled if required

## Production Readiness Notes

- Prisma `Subscription` is the source of truth for plan access
- Stripe webhook support is still required in production
- Free feature usage is tracked in `TrialUsage`
- Image uploads are indexed for semantic search
- Video analysis uses Gemini video understanding with inline upload for smaller files and Files API for larger files

## Suggested Domain Setup

For a real public website, use:

- `snaporbitai.com` or your brand domain
- `app.yourdomain.com` for the product
- `www.yourdomain.com` for the marketing site if you later split them

A common setup:

- Marketing: `www.yourdomain.com`
- App: `app.yourdomain.com`
- API and webhooks remain under the app domain

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

## Repository Notes

- Local tooling folders such as `.clerk/` and `.vercel/` should not be committed
- IDE-specific project notes can stay local and are now ignored through `.gitignore`
- Unused starter assets were removed from `public/`

## License

Add your preferred license before public deployment.
