# Saphira Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Your domain: `saphiraa.io`
- GitHub/GitLab/Bitbucket repository with your code

## Step 1: Push Code to Git Repository

If you haven't already, push your code to a Git repository:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Add remote repository (replace with your repo URL)
git remote add origin https://github.com/yourusername/saphira.git

# Push to main branch
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure project:
   - **Root Directory**: `frontend` (important!)
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Output Directory**: `.next`

4. Add Environment Variables (copy from your `.env.local`):
   ```
   NEXT_PUBLIC_APP_URL=https://saphiraa.io
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   OPENAI_API_KEY=your_openai_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   RESEND_API_KEY=your_resend_key
   ```

5. Click **Deploy**

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel --prod

# Follow prompts and set environment variables when asked
```

## Step 3: Configure Custom Domain (saphiraa.io)

1. In Vercel Dashboard, go to your project
2. Click **Settings** → **Domains**
3. Enter `saphiraa.io` and click **Add**
4. Follow DNS configuration:

### DNS Configuration (in your domain registrar)

Add these records:

**Option 1: A Record (Recommended)**
```
Type: A
Name: @
Value: 76.76.21.21
```

**Option 2: CNAME Record**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

5. Wait for DNS propagation (can take up to 48 hours, usually 5-30 minutes)
6. Vercel will automatically provision SSL certificate

## Step 4: Verify Deployment

1. Visit https://saphiraa.io
2. Check that all features work:
   - Sign up/login
   - Interview session
   - Voice functionality
   - Feedback generation

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Your domain (https://saphiraa.io) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase admin key |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs voice API |
| `RESEND_API_KEY` | Optional | Email service (optional) |

## Troubleshooting

### Build Errors
- Make sure `Root Directory` is set to `frontend` in Vercel settings
- Check that all environment variables are added

### API Routes Not Working
- Vercel automatically handles API routes in Next.js
- Check function logs in Vercel Dashboard → Functions

### Voice Not Working
- ElevenLabs API key must be valid
- Check Vercel function logs for API errors

### Domain Not Connecting
- Verify DNS records are correct
- Wait for DNS propagation
- Check Vercel Domain settings for verification status

## Updating Deployment

After making changes:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically redeploy on push to main branch.

## Support

- Vercel Docs: https://vercel.com/docs
- Custom Domains: https://vercel.com/docs/concepts/projects/custom-domains
