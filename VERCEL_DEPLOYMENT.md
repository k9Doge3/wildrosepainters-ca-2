# 🚀 Vercel Deployment Guide for Wildrose Painters

## Prerequisites
- GitHub repository already set up ✅
- All changes committed and pushed to GitHub ✅
- Gmail App Password generated for ky.group.solutions@gmail.com

## Step 1: Create Gmail App Password

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification** (enable if not already enabled)
3. Go back to **Security** → **App passwords**
4. Select **Mail** as the app and **Other** as the device
5. Enter "Wildrose Painters Website" as the device name
6. Copy the 16-character app password (format: xxxx xxxx xxxx xxxx)

## Step 2: Deploy to Vercel

1. Visit [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"New Project"**
3. Import your GitHub repository: `wildrosepainters-ca`
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `pnpm build` (or leave default)
   - **Output Directory**: `.next` (leave default)
   - **Install Command**: `pnpm install` (or leave default)

## Step 3: Set Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

| Name | Value | Environment |
|------|-------|-------------|
| `SMTP_EMAIL` | `ky.group.solutions@gmail.com` | Production, Preview, Development |
| `SMTP_PASSWORD` | `[your-16-character-app-password]` | Production, Preview, Development |

## Step 4: Configure Custom Domain

1. In Vercel dashboard → Settings → Domains
2. Add domain: `www.wildrosepainters.ca`
3. Follow Vercel's DNS configuration instructions
4. Add the required DNS records to your domain provider:
   - **Type**: CNAME
   - **Name**: www
   - **Value**: cname.vercel-dns.com

## Step 5: Verify Deployment

1. Once deployed, test the contact forms on your live site
2. Submit a test quote request
3. Verify emails are received at ky.group.solutions@gmail.com
4. Check that auto-reply is sent to the customer

## Environment Variables Reference

For local development (`.env.local`):
```env
SMTP_EMAIL=ky.group.solutions@gmail.com
SMTP_PASSWORD=your_16_character_app_password
```

For production (Vercel dashboard):
- Same variables as above
- Set for all environments (Production, Preview, Development)

## Troubleshooting

### Email not sending:
- Verify Gmail App Password is correct (16 characters, no spaces)
- Ensure 2-Step Verification is enabled on Gmail account
- Check Vercel deployment logs for error messages

### Contact form not working:
- Check browser console for JavaScript errors
- Verify API route is deployed: `your-domain.com/api/contact`
- Test with network tab open to see request/response

### Domain not working:
- DNS changes can take up to 48 hours to propagate
- Verify DNS records with your domain provider
- Use [DNS Checker](https://dnschecker.org/) to verify propagation

## Support
- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Gmail App Passwords**: [support.google.com/accounts/answer/185833](https://support.google.com/accounts/answer/185833)
- **DNS Help**: Contact your domain provider

---

✅ **Ready to deploy!** Your Next.js app with working contact forms is now ready for production on Vercel with the domain www.wildrosepainters.ca