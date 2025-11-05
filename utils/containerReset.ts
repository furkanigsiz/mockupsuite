// Container reset detection and auto-reload
const CHECK_INTERVAL = 2000; // Check every 2 seconds

async function checkContainerReset() {
  if (import.meta.env.PROD) return; // Only in development
  
  try {
    const response = await fetch('/.container-start-time?t=' + Date.now(), { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (response.ok) {
      const containerStartTime = await response.text();
      const storedStartTime = localStorage.getItem('container_start_time');
      
      if (storedStartTime && storedStartTime !== containerStartTime.trim()) {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        // Clear IndexedDB
        if ('indexedDB' in window && indexedDB.databases) {
          const dbs = await indexedDB.databases();
          await Promise.all(
            dbs.map(db => db.name ? indexedDB.deleteDatabase(db.name) : Promise.resolve())
          );
        }
        
        window.location.reload();
        return;
      }
      
      // Store the container start time
      if (!storedStartTime) {
        localStorage.setItem('container_start_time', containerStartTime.trim());
      }
    }
  } catch (error) {
    // Silently fail
  }
  
  // Schedule next check
  setTimeout(checkContainerReset, CHECK_INTERVAL);
}

// Start checking for container resets
if (import.meta.env.DEV) {
  checkContainerReset();
}

export {};
