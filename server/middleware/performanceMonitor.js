// Performance monitoring middleware
export const performanceMonitor = (req, res, next) => {
    const startTime = Date.now();
    
    // Log cold start indicators
    if (process.uptime() < 30) {
        console.log('🥶 COLD START DETECTED - Server uptime:', process.uptime(), 'seconds');
    }
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // Log slow requests (potential cold start impact)
        if (duration > 5000) {
            console.log(`🐌 SLOW REQUEST: ${req.method} ${req.path} - ${duration}ms`);
        }
        
        // Log auth requests specifically (your main concern)
        if (req.path.includes('/auth/')) {
            console.log(`🔐 AUTH REQUEST: ${req.method} ${req.path} - ${duration}ms - Status: ${res.statusCode}`);
        }
    });
    
    next();
};

export default performanceMonitor;