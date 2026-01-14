# Vercel Deployment Fix - Step by Step

## Problem
Vercel is showing old UI and CORS errors are preventing login.

## Solution

### Step 1: Wait for Vercel to Rebuild (2-3 minutes)
The latest push should trigger an automatic rebuild on Vercel. Check:
1. Go to https://vercel.com/dashboard
2. Find your SmartStock project
3. Check the "Deployments" tab
4. Wait for the latest deployment to finish

### Step 2: Update Render Environment Variables
The backend on Render needs to allow the Vercel domain:

1. Go to https://render.com/dashboard
2. Find your SmartStock backend service
3. Click on "Environment" tab
4. Add/Update this variable:
   ```
   ALLOWED_ORIGINS=https://smart-stock-ku3d.vercel.app,http://localhost:5173,http://localhost:3000,http://localhost:3001
   ```
5. Click "Save Changes"
6. Render will automatically redeploy (takes 5-10 minutes)

### Step 3: Clear Browser Cache
After both deployments finish:
1. Open the Vercel site: https://smart-stock-ku3d.vercel.app
2. Hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
3. Or open in Incognito/Private mode

### Step 4: Verify Deployment
Check these things:
1. ✅ Purple theme (not blue)
2. ✅ No emojis (icons instead)
3. ✅ Purple favicon in browser tab
4. ✅ Login works without CORS errors
5. ✅ Stock prices are correct (RELIANCE ~₹1458, TCS ~₹3197)

## Common Issues

### Issue 1: Vercel Still Shows Old UI
**Solution**: 
- Wait 5 minutes for CDN cache to clear
- Try incognito mode
- Check Vercel dashboard for deployment status

### Issue 2: CORS Errors Still Appear
**Solution**:
- Verify ALLOWED_ORIGINS is set on Render
- Make sure it includes: `https://smart-stock-ku3d.vercel.app`
- Wait for Render to finish redeploying
- Check Render logs for CORS configuration

### Issue 3: Login Not Working
**Solution**:
- Check browser console for errors
- Verify backend is running on Render
- Test backend directly: https://smartstock-lkcx.onrender.com/api/auth/test
- Check if MongoDB is connected

## Quick Test Commands

### Test Backend Health:
```bash
curl https://smartstock-lkcx.onrender.com/api/market/landing-data
```

### Test CORS:
Open browser console on Vercel site and run:
```javascript
fetch('https://smartstock-lkcx.onrender.com/api/market/landing-data')
  .then(r => r.json())
  .then(d => console.log('✅ CORS working:', d))
  .catch(e => console.error('❌ CORS error:', e))
```

## Environment Variables Checklist

### Vercel (Frontend):
- ✅ VITE_API_BASE_URL=https://smartstock-lkcx.onrender.com/api
- ✅ VITE_BACKEND_URL=https://smartstock-lkcx.onrender.com
- ✅ VITE_AI_SERVICE_URL=https://smartstock-ai-service.onrender.com
- ✅ VITE_GOOGLE_CLIENT_ID=817549154886-k5r92c4grcvr5usdiqfjtib2se0uc5qv.apps.googleusercontent.com

### Render (Backend):
- ✅ ALLOWED_ORIGINS=https://smart-stock-ku3d.vercel.app,http://localhost:5173,http://localhost:3000,http://localhost:3001
- ✅ MONGO_URI=(your MongoDB connection string)
- ✅ PORT=5050
- ✅ NODE_ENV=production
- ✅ JWT_SECRET=(your secret)

## Timeline

1. **Now**: Code pushed to GitHub ✅
2. **2-3 min**: Vercel rebuilds automatically
3. **5-10 min**: Update Render env vars and wait for redeploy
4. **Total**: ~15 minutes for everything to be live

## Status Check

After 15 minutes, verify:
1. Vercel deployment status: https://vercel.com/dashboard
2. Render deployment status: https://render.com/dashboard
3. Test the live site: https://smart-stock-ku3d.vercel.app
4. Check browser console for errors

## If Still Not Working

1. Check Vercel build logs for errors
2. Check Render logs for CORS errors
3. Verify all environment variables are set correctly
4. Try deploying from Vercel dashboard manually
5. Contact me with specific error messages from console
