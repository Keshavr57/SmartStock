# Quick Deployment Fix - 2 Steps Only

## 🎯 Step 1: Render Environment Variable

**Go to:** https://render.com/dashboard

1. Click your backend service
2. Click "Environment" tab
3. Add variable: `ALLOWED_ORIGINS`
4. Value: `https://smart-stock-ku3d.vercel.app,http://localhost:5173,http://localhost:3000,http://localhost:3001`
5. Save (auto redeploys in 5-10 min)

## 🎯 Step 2: Vercel Environment Variables

**Go to:** https://vercel.com/dashboard

1. Click your project → Settings → Environment Variables
2. Add these 4 variables:

```
VITE_API_BASE_URL = https://smartstock-lkcx.onrender.com/api
VITE_BACKEND_URL = https://smartstock-lkcx.onrender.com
VITE_AI_SERVICE_URL = https://smartstock-ai-service.onrender.com
VITE_GOOGLE_CLIENT_ID = 817549154886-k5r92c4grcvr5usdiqfjtib2se0uc5qv.apps.googleusercontent.com
```

3. Go to Deployments → Click 3 dots → Redeploy
4. Wait 2-3 minutes

## ✅ Done!

Wait 15 minutes total, then open: https://smart-stock-ku3d.vercel.app

Press **Cmd+Shift+R** to hard refresh.

---

**That's it!** The old UI issue is because Vercel doesn't have the environment variables set in the dashboard. The vercel.json file doesn't set them automatically - you must add them manually in the Vercel dashboard.
