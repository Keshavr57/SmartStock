/**
 * Production console override
 * Disables console logs in production to maintain clean user experience
 */

// Only disable console logs in production
if (import.meta.env.PROD) {
  // Store original console methods for development debugging if needed
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };

  // Override console methods in production
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
  
  // Keep console.error for critical errors (but make them less verbose)
  console.error = (...args: any[]) => {
    // Only show critical errors in production
    if (args.some(arg => 
      typeof arg === 'string' && 
      (arg.includes('CRITICAL') || arg.includes('FATAL') || arg.includes('Authentication'))
    )) {
      originalConsole.error(...args);
    }
  };

  // Add a way to restore console for debugging if needed
  (window as any).__restoreConsole = () => {
    Object.assign(console, originalConsole);
  };
}

export {};