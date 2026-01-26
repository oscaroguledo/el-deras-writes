# Netlify Deployment Guide

This guide explains how to deploy the El Deras Writes frontend to Netlify.

## Prerequisites

- GitHub repository with your code
- Netlify account (free tier available)
- Backend deployed and accessible via HTTPS

## Deployment Steps

### 1. Connect Repository to Netlify

1. Log in to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Choose GitHub and authorize Netlify
4. Select your `el-deras-writes` repository

### 2. Configure Build Settings

**Build Settings:**
- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `frontend/dist`

### 3. Environment Variables

In Netlify dashboard, go to Site settings > Environment variables and add:

```
VITE_API_URL=https://your-backend-url.com
```

Replace `your-backend-url.com` with your actual backend URL.

### 4. Deploy

1. Click "Deploy site"
2. Netlify will automatically build and deploy your site
3. You'll get a URL like `https://amazing-name-123456.netlify.app`

### 5. Custom Domain (Optional)

1. In Site settings > Domain management
2. Add your custom domain
3. Configure DNS records as instructed

## Backend Configuration

Ensure your backend allows the Netlify domain:

### Django Settings (already configured)

```python
ALLOWED_HOSTS = [
    # ... other hosts
    '.netlify.app',
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    # ... other regexes
    r"^https:\/\/.*\.netlify\.app$",
]
```

### Environment Variables

Update your `.env` file:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-netlify-site.netlify.app
```

## Automatic Deployments

Netlify automatically deploys when you push to your main branch. To deploy from a different branch:

1. Go to Site settings > Build & deploy
2. Change the production branch

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### API Calls Fail
- Check CORS configuration in backend
- Verify `VITE_API_URL` environment variable
- Ensure backend is accessible via HTTPS

### 404 Errors on Refresh
- The `netlify.toml` file should handle SPA routing
- Verify the redirect rule is in place

## Features Included

✅ **Automatic Builds:** Deploys on every push to main branch  
✅ **SPA Routing:** Proper handling of React Router  
✅ **Security Headers:** XSS protection, content type sniffing prevention  
✅ **Caching:** Optimized caching for static assets  
✅ **HTTPS:** Automatic SSL certificate  
✅ **CDN:** Global content delivery network  

## Cost

- **Free Tier:** 100GB bandwidth, 300 build minutes/month
- **Pro Tier:** $19/month for more resources and features

## Support

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Community](https://community.netlify.com/)
- [GitHub Issues](https://github.com/oscaroguledo/el-deras-writes/issues)