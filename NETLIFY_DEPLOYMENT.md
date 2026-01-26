# Netlify Deployment Guide

This guide explains how to deploy the El Deras Writes frontend to Netlify.

## 🚀 Current Deployment Status

[![Netlify Status](https://api.netlify.com/api/v1/badges/da951703-7aad-4942-9d57-f187f2132311/deploy-status)](https://app.netlify.com/projects/superlative-kitsune-f19d67/deploys)

**Site URL**: https://elderawrites.netlify.app  
**Admin Dashboard**: https://app.netlify.com/sites/elderawrites

## Prerequisites

- GitHub repository with your code
- Netlify account (free tier available)
- Backend deployed and accessible via HTTPS

## ✅ Deployment Checklist

### 1. Repository Configuration
- [x] Repository connected to Netlify
- [x] `netlify.toml` configuration file present
- [x] Build command: `npm ci && npm run build`
- [x] Base directory: `frontend/`
- [x] Publish directory: `dist/`

### 2. Build Settings Verification

**Current Settings:**
```toml
[build]
  base = "frontend/"
  publish = "dist/"
  command = "npm ci && npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"
```

### 3. Environment Variables

In Netlify dashboard, ensure these variables are set:

| Variable | Value | Status |
|----------|-------|--------|
| `VITE_API_URL` | `https://el-deras-writes-backend.onrender.com/` | ⚠️ **Required** |
| `NODE_VERSION` | `18` | ✅ Set in netlify.toml |
| `NPM_VERSION` | `9` | ✅ Set in netlify.toml |

### 4. Domain Configuration

**Current Domain**: `elderawrites.netlify.app`

To set up a custom domain:
1. Go to Site settings > Domain management
2. Add your custom domain
3. Configure DNS records as instructed
4. Update backend CORS settings with new domain

## 🔧 Troubleshooting

### Build Fails
- ✅ **Dependencies**: All packages in package.json
- ✅ **Node Version**: 18 (compatible)
- ✅ **Build Command**: `npm ci && npm run build` works locally
- ✅ **TypeScript**: No blocking errors

### API Calls Fail
- ⚠️ **Backend URL**: Ensure `VITE_API_URL` is set correctly
- ⚠️ **CORS**: Backend must allow your Netlify domain
- ⚠️ **HTTPS**: Backend must be accessible via HTTPS

### 404 Errors on Refresh
- ✅ **SPA Routing**: Configured in netlify.toml
- ✅ **Redirects**: All routes redirect to index.html

## 🛠️ Manual Deployment Steps

If you need to set up from scratch:

### 1. Connect Repository to Netlify

1. Log in to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Choose GitHub and authorize Netlify
4. Select your `el-deras-writes` repository

### 2. Configure Build Settings

**Build Settings:**
- **Base directory:** `frontend`
- **Build command:** `npm ci && npm run build`
- **Publish directory:** `frontend/dist`

### 3. Environment Variables

In Netlify dashboard, go to Site settings > Environment variables and add:

```
VITE_API_URL=https://el-deras-writes-backend.onrender.com/api
```

Replace `your-backend-url.com` with your actual backend URL.

### 4. Deploy

1. Click "Deploy site"
2. Netlify will automatically build and deploy your site
3. You'll get a URL like `https://amazing-name-123456.netlify.app`

## 🔄 Automatic Deployments

- ✅ **Auto-deploy**: Enabled on push to main branch
- ✅ **Build previews**: Available for pull requests
- ✅ **Deploy notifications**: Available in Netlify dashboard

## 🌐 Backend Configuration

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

Update your backend `.env` file:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://elderawrites.netlify.app
```

## 📊 Performance Features

✅ **Automatic Builds**: Deploys on every push to main branch  
✅ **SPA Routing**: Proper handling of React Router  
✅ **Security Headers**: XSS protection, content type sniffing prevention  
✅ **Caching**: Optimized caching for static assets  
✅ **HTTPS**: Automatic SSL certificate  
✅ **CDN**: Global content delivery network  
✅ **Build Optimization**: Tree shaking and code splitting

## 💰 Cost

- **Free Tier**: 100GB bandwidth, 300 build minutes/month
- **Pro Tier**: $19/month for more resources and features

## 🆘 Support

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Community](https://community.netlify.com/)
- [GitHub Issues](https://github.com/oscaroguledo/el-deras-writes/issues)

## 🚀 Next Steps

1. **Set Backend URL**: Add `VITE_API_URL` environment variable in Netlify
2. **Test Deployment**: Visit your Netlify URL and test functionality
3. **Custom Domain**: Set up your custom domain if desired
4. **Monitor**: Use Netlify analytics to monitor performance