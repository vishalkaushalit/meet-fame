import { useEffect, useState } from 'react';
import { api } from '../api';

// The homepage owns featured data; dashboard and account routes do not need it.
export default function useFeaturedInfluencers(enabled) {
  const [influencers, setInfluencers] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    api.influencers
      .getAll()
      .then((result) => {
        if (active) setInfluencers(result.influencers || []);
      })
      .catch((error) => {
        if (active)
          console.error('Failed to load featured influencers:', error);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return influencers;
}
