# SnapOrbitAI

git add README.md

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

SnapOrbitAI is a comprehensive media management platform designed for content creators and businesses. It provides an intuitive interface for uploading, organizing, optimizing, and sharing media with advanced compression capabilities and social media integration.

**Live Demo:** [Coming Soon](#)  
**Documentation:** See [docs](#) for detailed guides

---

## ✨ Features

- **Video Upload & Management** - Seamlessly upload and manage video files with automatic processing
- **Social Media Integration** - Share videos directly to social platforms with optimized formats
- **Video Compression** - Intelligent automatic compression to reduce file sizes without quality loss
- **User Authentication** - Secure authentication powered by Clerk
- **Dashboard** - Comprehensive home dashboard for managing all uploaded content
- **Responsive Design** - Fully responsive UI that works across all devices
- **Real-time Updates** - Live status updates for video processing
- **Database Management** - Robust PostgreSQL database with Prisma ORM

---

## 🛠 Tech Stack

### Frontend

- **Framework:** [Next.js 16.2.1](https://nextjs.org) - React-based framework with App Router
- **UI Library:** [React 19.2.4](https://react.dev)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com) with [DaisyUI 5.5.19](https://daisyui.com)
- **Language:** [TypeScript 5](https://www.typescriptlang.org)

### Backend & Database

- **ORM:** [Prisma 7.5.0](https://www.prisma.io)
- **Database:** PostgreSQL with [Prisma Adapter](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#pgadapter)
- **API Routes:** Next.js API Routes (App Router)

### Authentication & External Services

- **Auth:** [Clerk 7.0.6](https://clerk.com) - Authentication & user management
- **Media Processing:** [Cloudinary](https://cloudinary.com) - Video hosting and processing

### Development Tools

- **Linting:** [ESLint 9](https://eslint.org)
- **Package Manager:** npm / yarn / pnpm
- **Environment Configuration:** dotenv

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.17 or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- **PostgreSQL** 12 or higher (local or cloud-hosted)
- **Git** for version control

### Required Accounts

- [Cloudinary](https://cloudinary.com) - For video hosting and processing
- [Clerk](https://clerk.com) - For authentication
- PostgreSQL database (local or cloud provider like Neon, Railway, etc.)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/snaporbitai.git
cd snaporbitai
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory (see [Environment Variables](#environment-variables) section below)

### 4. Set Up the Database

```bash
npx prisma migrate dev
```

This command will:

- Create the database schema
- Apply all migrations
- Generate Prisma Client

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cloudinary_saas"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Getting API Keys

**Clerk:**

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy keys from the API Keys section

**Cloudinary:**

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Navigate to Settings → API Keys
3. Copy your Cloud Name and API credentials

**PostgreSQL:**

- Local: `postgresql://localhost:5432/cloudinary_saas`
- Cloud providers provide connection strings

---

## 🎮 Getting Started

### Available Scripts

| Command         | Description                           |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start development server on port 3000 |
| `npm run build` | Build for production                  |
| `npm start`     | Start production server               |
| `npm run lint`  | Run ESLint to check code quality      |

### Development Workflow

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Navigate to the app:**
   - Home: [http://localhost:3000](http://localhost:3000)
   - Sign In: [http://localhost:3000/sign-in](http://localhost:3000/sign-in)
   - Sign Up: [http://localhost:3000/sign-up](http://localhost:3000/sign-up)

3. **Hot Reload:** Changes to files in `app/` directory are automatically reflected

4. **Database Changes:**
   ```bash
   npx prisma migrate dev --name description_of_change
   ```

---

## 📁 Project Structure

```
snaporbitai/
├── app/
│   ├── (app)/                    # Protected app routes
│   │   ├── home/                 # Dashboard
│   │   ├── social-share/         # Social sharing interface
│   │   └── video-upload/         # Video upload interface
│   ├── (auth)/                   # Public auth routes
│   │   ├── sign-in/              # Sign in page
│   │   └── sign-up/              # Sign up page
│   ├── api/
│   │   └── videos/               # Video API endpoints
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
├── lib/
│   └── prisma.ts                 # Prisma client configuration
├── public/                       # Static assets
├── generated/
│   └── prisma/                   # Generated Prisma types
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

---

## 🗄 Database Setup

### Schema Overview

The application uses a `Video` model to store video metadata:

```prisma
model Video {
  id              String   @id @default(cuid())
  title           String
  description     String?
  publicId        String
  originalSize    String
  compressedSize  String
  duration        String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Migrations

To create a new migration after schema changes:

```bash
npx prisma migrate dev --name add_your_field_name
```

To reset the database (development only):

```bash
npx prisma migrate reset
```

To view database in Prisma Studio:

```bash
npx prisma studio
```

---

## 📡 API Documentation

### Video Endpoints

#### Get All Videos

```http
GET /api/videos
```

#### Create Video

```http
POST /api/videos
Content-Type: application/json

{
  "title": "My Video",
  "description": "Video description",
  "publicId": "cloudinary_public_id",
  "originalSize": "50MB",
  "compressedSize": "10MB",
  "duration": "5:30"
}
```

#### More endpoints coming soon...

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow ESLint rules: `npm run lint`
- Use TypeScript for type safety
- Follow the existing component structure
- Add comments for complex logic

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support & Contact

For support, email support@example.com or open an issue on GitHub.

**Report a Bug:** [GitHub Issues](https://github.com/yourusername/snaporbitai/issues)  
**Feature Requests:** [GitHub Discussions](https://github.com/yourusername/snaporbitai/discussions)

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

- **Netlify:** [Deploy Next.js on Netlify](https://docs.netlify.com/frameworks-and-languages/next-js/)
- **Railway:** [Railway Guide](https://railway.app)
- **Self-hosted:** Use `npm run build && npm start`

---

**Last Updated:** March 2026  
**Version:** 0.1.0
