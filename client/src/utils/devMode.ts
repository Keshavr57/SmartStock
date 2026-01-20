/**
 * Development mode utilities
 * Only active in development environment
 */

if (import.meta.env.DEV) {
  // Add a subtle development indicator
  const devIndicator = document.createElement('div');
  devIndicator.innerHTML = '🔧 DEV';
  devIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #1f2937;
    color: #10b981;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-family: monospace;
    z-index: 9999;
    opacity: 0.7;
    pointer-events: none;
  `;
  
  // Add to DOM when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(devIndicator);
    });
  } else {
    document.body.appendChild(devIndicator);
  }

  // Add development console commands
  (window as any).__dev = {
    clearStorage: () => {
      localStorage.clear();
      sessionStorage.clear();
      location.reload();
    },
    showAuth: () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      return { token: token?.substring(0, 20) + '...', user: user ? JSON.parse(user) : null };
    },
    restoreConsole: () => {
      if ((window as any).__restoreConsole) {
        (window as any).__restoreConsole();
      }
    }
  };
}

export {};