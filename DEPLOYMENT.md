# Saphira Deployment Guide

## Prerequisites

- Node.js 18+ 
- Git
- Vercel account (recommended for Next.js)
- Supabase account
- OpenAI API key
- ElevenLabs API key

## Environment Variables

Create a `.env.local` file in the `frontend/` directory with:

```env
# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (Required for AI interviews)
OPENAI_API_KEY=sk-your-openai-api-key

# ElevenLabs (Required for voice)
ELEVENLABS_API_KEY=sk-your-elevenlabs-api-key

# Stripe (Required for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_SECRET_KEY=sk_test_your-key

# Resend (Required for email)
RESEND_API_KEY=re_your-api-key
```

## Step 1: Push to GitHub

```bash
cd C:\Users\OMEN\Desktop\saphire
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/runcor-io/Saphira.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
cd frontend
vercel
```

### Option B: Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import from GitHub: `runcor-io/Saphira`
4. Set root directory to `frontend`
5. Add environment variables from above
6. Deploy

## Step 3: Supabase Setup

1. Create project at https://supabase.com
2. Run the database schema (see `supabase/schema.sql`)
3. Get API keys from Settings > API
4. Add to Vercel environment variables

## Step 4: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to Project Settings > Domains
2. Add your custom domain
3. Update `NEXT_PUBLIC_APP_URL` environment variable

## Important Notes

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Troubleshooting

### Build Failures

Check that all environment variables are set in Vercel dashboard.

### API Errors

Ensure:
1. OpenAI API key is valid
2. ElevenLabs API key is valid
3. Supabase URL and keys are correct

### Voice Not Working

- ElevenLabs API key must be set
- Check browser console for errors
- Ensure HTTPS (required for microphone access)
