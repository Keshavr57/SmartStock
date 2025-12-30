# 🚀 SmartStock Deployment Guide

This guide provides all the environment variables and configuration needed to deploy SmartStock to production.

## 📋 Environment Variables

### **Frontend (.env.production)**
```env
# Production API URLs - Update with your deployed backend URLs
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_AI_SERVICE_URL=https://your-ai-service-domain.com
VITE_BACKEND_URL=https://your-backend-domain.com
```

### **Backend (server/.env)**
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/SmartStock

# Server Configuration
PORT=5050
NODE_ENV=production

# CORS Configuration (comma-separated frontend URLs)
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# API Keys for Stock Data
INDIAN_API_KEY=your_indian_api_key
FMP_API_KEY=your_fmp_api_key
ALPHA_VANTAGE_KEY=your_alpha_vantage_key
POLYGON_API_KEY=your_polygon_api_key
FINNHUB_API_KEY=your_finnhub_api_key

# Authentication
JWT_SECRET=your_secure_jwt_secret_64_chars_long
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### **AI Service (ai-service/.env)**
```env
# AI/LLM Service Configuration
GROQ_API_KEY=your_groq_api_key

# Service Configuration
PORT=8000
HOST=0.0.0.0
NODE_ENV=production
```

## 🔧 Platform-Specific Deployment

### **Vercel (Frontend)**
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL`: Your backend API URL
   - `VITE_AI_SERVICE_URL`: Your AI service URL
   - `VITE_BACKEND_URL`: Your backend URL

### **Heroku (Backend)**
1. Create a new Heroku app
2. Set environment variables in Heroku dashboard or CLI:
```bash
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set ALLOWED_ORIGINS=https://your-frontend.vercel.app
# ... add all other variables
```

### **Railway (AI Service)**
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard:
   - `GROQ_API_KEY`: Your Groq API key
   - `PORT`: 8000
   - `HOST`: 0.0.0.0

### **Render (Alternative for Backend/AI Service)**
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Use the same environment variables as listed above

## 🔐 Security Checklist

### **Generate New Secrets for Production**
```bash
# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **Update Google OAuth**
1. Go to Google Cloud Console
2. Update authorized redirect URIs with your production domains
3. Update JavaScript origins with your frontend domain

### **Database Security**
1. Use MongoDB Atlas with IP whitelisting
2. Create a dedicated database user for production
3. Use strong passwords and connection strings

### **API Keys**
1. Rotate all API keys for production use
2. Use environment-specific keys where possible
3. Monitor API usage and set up alerts

## 📝 Deployment Steps

### **1. Frontend Deployment (Vercel)**
```bash
# Build the frontend locally to test
cd client
npm run build

# Deploy to Vercel
vercel --prod
```

### **2. Backend Deployment (Heroku)**
```bash
# Login to Heroku
heroku login

# Create new app
heroku create smartstock-backend

# Set environment variables
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
# ... set all other variables

# Deploy
git subtree push --prefix server heroku main
```

### **3. AI Service Deployment (Railway)**
```bash
# Connect to Railway and deploy through their dashboard
# Or use Railway CLI
railway login
railway link
railway up
```

## 🌐 Domain Configuration

### **Custom Domains**
1. **Frontend**: Configure custom domain in Vercel
2. **Backend**: Configure custom domain in Heroku
3. **AI Service**: Configure custom domain in Railway

### **SSL Certificates**
- All platforms provide automatic SSL certificates
- Ensure HTTPS is enforced for all services

## 🔍 Testing Deployment

### **Health Check Endpoints**
- Backend: `GET /api/health`
- AI Service: `GET /health`

### **Test Checklist**
- [ ] Frontend loads correctly
- [ ] API calls work from frontend to backend
- [ ] AI service responds to queries
- [ ] Authentication works (login/register)
- [ ] Google OAuth works
- [ ] WebSocket connections work
- [ ] Database operations work
- [ ] All environment variables are set

## 🚨 Troubleshooting

### **Common Issues**
1. **CORS Errors**: Check `ALLOWED_ORIGINS` environment variable
2. **Database Connection**: Verify `MONGO_URI` and network access
3. **API Failures**: Check API keys and rate limits
4. **WebSocket Issues**: Ensure WebSocket support on hosting platform

### **Logs**
- **Heroku**: `heroku logs --tail`
- **Vercel**: Check function logs in dashboard
- **Railway**: Check deployment logs in dashboard

## 📊 Monitoring

### **Recommended Monitoring**
1. **Uptime Monitoring**: Use services like UptimeRobot
2. **Error Tracking**: Implement Sentry for error tracking
3. **Performance**: Monitor API response times
4. **Database**: Monitor MongoDB Atlas metrics

## 🔄 CI/CD Pipeline

### **GitHub Actions Example**
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 Support

For deployment issues:
1. Check the logs first
2. Verify all environment variables are set
3. Test each service independently
4. Check network connectivity between services

---

**⚠️ Important**: Never commit `.env` files to version control. Use platform-specific environment variable management.