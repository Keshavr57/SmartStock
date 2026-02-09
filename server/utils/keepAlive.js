import axios from 'axios';

const RENDER_URL = process.env.RENDER_URL || 'https://smartstock-lkcx.onrender.com';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://smartstock-ai-service.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (before 15min sleep)

class KeepAliveService {
    constructor() {
        this.intervalId = null;
        this.isEnabled = process.env.NODE_ENV === 'production';
    }

    async pingService(url, name) {
        try {
            const response = await axios.get(`${url}/health`, {
                timeout: 10000
            });
            console.log(`✅ ${name} ping successful: ${response.status}`);
            return true;
        } catch (error) {
            console.log(`❌ ${name} ping failed: ${error.message}`);
            return false;
        }
    }

    start() {
        if (!this.isEnabled) {
            console.log('Keep-alive disabled in development');
            return;
        }

        console.log('🔄 Starting keep-alive service...');
        console.log(`📍 Backend URL: ${RENDER_URL}`);
        console.log(`🤖 AI Service URL: ${AI_SERVICE_URL}`);
        
        this.intervalId = setInterval(async () => {
            console.log('⏰ Keep-alive ping cycle started...');
            
            // Ping backend
            await this.pingService(RENDER_URL, 'Backend');
            
            // Ping AI service (IMPORTANT!)
            await this.pingService(AI_SERVICE_URL, 'AI Service');
            
            console.log('⏰ Keep-alive ping cycle completed');
        }, PING_INTERVAL);

        // Initial ping after 5 seconds
        setTimeout(async () => {
            console.log('🚀 Initial keep-alive ping...');
            await this.pingService(RENDER_URL, 'Backend');
            await this.pingService(AI_SERVICE_URL, 'AI Service');
        }, 5000);

        console.log(`✅ Keep-alive service started (ping every ${PING_INTERVAL/60000} minutes)`);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('🛑 Keep-alive service stopped');
        }
    }
}

export default new KeepAliveService();