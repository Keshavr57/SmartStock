import axios from 'axios';

const RENDER_URL = process.env.RENDER_URL || 'https://smartstock-lkcx.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (before 15min sleep)

class KeepAliveService {
    constructor() {
        this.intervalId = null;
        this.isEnabled = process.env.NODE_ENV === 'production';
    }

    start() {
        if (!this.isEnabled) {
            console.log('Keep-alive disabled in development');
            return;
        }

        console.log('🔄 Starting keep-alive service...');
        
        this.intervalId = setInterval(async () => {
            try {
                const response = await axios.get(`${RENDER_URL}/api/health`, {
                    timeout: 10000
                });
                console.log(`Keep-alive ping successful: ${response.status}`);
            } catch (error) {
                console.log('Keep-alive ping failed:', error.message);
            }
        }, PING_INTERVAL);

        console.log(`Keep-alive service started (ping every ${PING_INTERVAL/60000} minutes)`);
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