import { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';

const API_BASE_URL = 'http://localhost:3001/api/songs';

export function useSongPersistence(id: string | undefined, initialSong: Song) {
  const [song, setSong] = useState<Song>(initialSong);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load song
  useEffect(() => {
    if (id && id !== 'new') {
      setLoading(true);
      fetch(`${API_BASE_URL}/${id}`)
        .then(res => res.json())
        .then(res => {
          if (res.data) {
            try {
              const loadedSong = JSON.parse(res.data.data);
              // Ensure loaded song has title/artist from DB if not in JSON
              loadedSong.title = res.data.title || loadedSong.title;
              loadedSong.originalArtist = res.data.artist || loadedSong.originalArtist;
              setSong(loadedSong);
            } catch (e) {
              console.error("Error parsing song data", e);
              setError("Failed to parse song data");
            }
          }
        })
        .catch(err => {
            console.error("Error loading song:", err);
            setError(err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const saveSong = useCallback(async () => {
    const isNew = !id || id === 'new';
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? API_BASE_URL : `${API_BASE_URL}/${id}`;

    const body = {
      title: song.title,
      artist: song.originalArtist,
      key_signature: 'C', // Default for now
      data: song
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const res = await response.json();
      
      if (res.message === 'success') {
        return { success: true, id: res.data?.id };
      } else {
        return { success: false, error: res.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [id, song]);

  return { song, setSong, saveSong, loading, error };
}
