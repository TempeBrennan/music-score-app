import { useCallback } from 'react';
import { Song, NoteV2, Degree, Accidental, Duration as DurationEnum, Measure } from '../types';

export function useSongOperations(song: Song, setSong: (song: Song) => void, selectedNoteId: string | null, setSelectedNoteId: (id: string | null) => void) {

  const getNoteById = useCallback((id: string): { note: NoteV2; measureIdx: number; elementIdx: number; noteIdx: number } | null => {
    const match = id.match(/^measure-(\d+)-group-(\d+)-note-(\d+)$/);
    if (!match) return null;
    const measureIdx = parseInt(match[1]);
    const elementIdx = parseInt(match[2]);
    const noteIdx = parseInt(match[3]);
    const measure = song.measures[measureIdx];
    if (!measure) return null;
    const el = measure.elements[elementIdx];
    if (!el || el.type !== 'group') return null;
    const note = el.group.notes[noteIdx];
    if (!note) return null;
    return { note, measureIdx, elementIdx, noteIdx };
  }, [song]);

  const updateNote = useCallback((updated: NoteV2) => {
    if (!selectedNoteId) return;
    const found = getNoteById(selectedNoteId);
    if (!found) return;
    
    // Deep copy
    const newSong: Song = JSON.parse(JSON.stringify(song));
    if (!newSong.measures[found.measureIdx]) return;
    
    const el = newSong.measures[found.measureIdx].elements[found.elementIdx];
    if (!el || el.type !== 'group') return;
    
    el.group.notes[found.noteIdx] = updated;
    setSong(newSong);
  }, [song, selectedNoteId, getNoteById, setSong]);

  const deleteNote = useCallback(() => {
    if (!selectedNoteId) return;
    const found = getNoteById(selectedNoteId);
    if (!found) return;
    
    const newSong: Song = JSON.parse(JSON.stringify(song));
    const el = newSong.measures[found.measureIdx].elements[found.elementIdx];
    if (!el || el.type !== 'group') return;
    
    // Determine next selection
    let nextSelectedId: string | null = null;
    
    if (el.group.notes.length > 1) {
      if (found.noteIdx < el.group.notes.length - 1) {
        nextSelectedId = `measure-${found.measureIdx}-group-${found.elementIdx}-note-${found.noteIdx}`;
      } else if (found.noteIdx > 0) {
        nextSelectedId = `measure-${found.measureIdx}-group-${found.elementIdx}-note-${found.noteIdx - 1}`;
      }
    } else {
      const measure = newSong.measures[found.measureIdx];
      // Try next group
      for (let i = found.elementIdx + 1; i < measure.elements.length; i++) {
        const element = measure.elements[i];
        if (element.type === 'group' && element.group.notes.length > 0) {
          nextSelectedId = `measure-${found.measureIdx}-group-${i}-note-0`;
          break;
        }
      }
      // Try prev group
      if (!nextSelectedId) {
        for (let i = found.elementIdx - 1; i >= 0; i--) {
          const element = measure.elements[i];
          if (element.type === 'group' && element.group.notes.length > 0) {
            const lastNoteIdx = element.group.notes.length - 1;
            nextSelectedId = `measure-${found.measureIdx}-group-${i}-note-${lastNoteIdx}`;
            break;
          }
        }
      }
    }
    
    // Delete note
    el.group.notes.splice(found.noteIdx, 1);
    
    // Delete group if empty
    if (el.group.notes.length === 0) {
      newSong.measures[found.measureIdx].elements.splice(found.elementIdx, 1);
    }
    
    setSong(newSong);
    setSelectedNoteId(nextSelectedId);
  }, [song, selectedNoteId, getNoteById, setSong, setSelectedNoteId]);

  const addMeasure = useCallback(() => {
    const newSong: Song = JSON.parse(JSON.stringify(song));
    const newMeasure: Measure = {
      elements: [
        {
          type: 'group',
          group: {
            notes: [
              {
                degree: Degree.Pause,
                accidental: Accidental.Natural,
                duration: DurationEnum.Quarter,
              },
            ],
            lyric: "歌词",
          },
        },
      ],
    };
    newSong.measures.push(newMeasure);
    setSong(newSong);
  }, [song, setSong]);

  const appendNote = useCallback(() => {
    if (!selectedNoteId) return;
    const found = getNoteById(selectedNoteId);
    if (!found) return;
    
    const newSong: Song = JSON.parse(JSON.stringify(song));
    const el = newSong.measures[found.measureIdx].elements[found.elementIdx];
    if (!el || el.type !== 'group') return;
    
    const newNote: NoteV2 = {
      degree: Degree.Pause,
      accidental: Accidental.Natural,
      duration: DurationEnum.Quarter,
    };
    
    el.group.notes.splice(found.noteIdx + 1, 0, newNote);
    setSong(newSong);
    const newNoteId = `measure-${found.measureIdx}-group-${found.elementIdx}-note-${found.noteIdx + 1}`;
    setSelectedNoteId(newNoteId);
  }, [song, selectedNoteId, getNoteById, setSong, setSelectedNoteId]);

  const deleteMeasure = useCallback((measureIdx: number) => {
    const newSong: Song = JSON.parse(JSON.stringify(song));
    if (newSong.measures.length <= 1) return; // keep at least one measure
    newSong.measures.splice(measureIdx, 1);
    setSong(newSong);
    setSelectedNoteId(null);
  }, [song, setSong, setSelectedNoteId]);

  return {
    getNoteById,
    updateNote,
    deleteNote,
    addMeasure,
    appendNote,
    deleteMeasure,
  };
}
