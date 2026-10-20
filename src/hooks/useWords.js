import { useState, useEffect } from 'react';
import { getAllWords } from '../services/wordService';

/**
 * Custom hook to fetch and cache words from Firestore
 * @param {string} userId - Current user's ID for filtering
 */
export function useWords(userId = null) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWords() {
      try {
        // Check session cache first
        const cacheKey = `words_cache_curated_v1_${userId || 'global'}`;
        const timestampKey = `words_cache_timestamp_curated_v1_${userId || 'global'}`;
        const cachedWords = sessionStorage.getItem(cacheKey);
        const cacheTimestamp = sessionStorage.getItem(timestampKey);
        const now = Date.now();

        // Use cache if less than 5 minutes old
        if (cachedWords && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 5 * 60 * 1000) {
          setWords(JSON.parse(cachedWords));
          setLoading(false);
          return;
        }

        // Fetch from Firestore
        const wordsData = await getAllWords(userId);
        setWords(wordsData);

        // Cache the results
        sessionStorage.setItem(cacheKey, JSON.stringify(wordsData));
        sessionStorage.setItem(timestampKey, now.toString());

        setLoading(false);
      } catch (err) {
        console.error('Error fetching words:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchWords();
  }, [userId]);

  const refreshWords = async () => {
    setLoading(true);
    setError(null);
    try {
      const wordsData = await getAllWords(userId);
      setWords(wordsData);
      const cacheKey = `words_cache_curated_v1_${userId || 'global'}`;
      const timestampKey = `words_cache_timestamp_curated_v1_${userId || 'global'}`;
      sessionStorage.setItem(cacheKey, JSON.stringify(wordsData));
      sessionStorage.setItem(timestampKey, Date.now().toString());
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return { words, loading, error, refreshWords };
}
