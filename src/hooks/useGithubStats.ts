import { useState, useEffect } from 'react';

let globalStats = { stars: 0, forks: 0 };
let listeners: ((stats: { stars: number; forks: number }) => void)[] = [];
let hasFetched = false;

export function useGithubStats() {
  const [stats, setStats] = useState(globalStats);

  useEffect(() => {
    listeners.push(setStats);
    
    if (!hasFetched) {
      hasFetched = true;
      const fetchStats = async () => {
        try {
          const res = await fetch('https://api.github.com/repos/ThiruXD/ThiruXDB');
          if (res.ok) {
            const data = await res.json();
            if (data.stargazers_count !== undefined) {
              const newStats = { stars: data.stargazers_count, forks: data.forks_count };
              globalStats = newStats;
              listeners.forEach(listener => listener(newStats));
            }
          }
        } catch (e) {
          console.error("Failed to fetch Github stats:", e);
        }
      };
      
      fetchStats();
      
      // Sync automatically every 5 minutes
      setInterval(fetchStats, 5 * 60 * 1000);
    }
    
    return () => {
      listeners = listeners.filter(l => l !== setStats);
    };
  }, []);

  return stats;
}
