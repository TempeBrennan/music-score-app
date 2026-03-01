
import { Song, Measure, MeasureElement, Group, NoteV2 } from '../types';

// Helper to convert object-based collections (from some JSON exports) to arrays
const normalizeCollection = <T>(collection: any): T[] => {
  if (Array.isArray(collection)) return collection;
  if (!collection) return [];
  // Setup array based on keys like "0", "1", ...
  return Object.keys(collection)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(key => collection[key]);
};

// Deep normalization of song data structure
export const normalizeSongData = (data: any): Song => {
  if (!data) {
      throw new Error("Invalid song data");
  }

  // 1. Normalize measures
  const rawMeasures = normalizeCollection(data.measures);

  const measures: Measure[] = rawMeasures.map((m: any) => {
    // 2. Normalize elements in each measure
    const rawElements = normalizeCollection(m.elements);

    const elements: MeasureElement[] = rawElements.map((el: any) => {
       if (el.group) {
          // 3. Normalize notes in each group
          const rawNotes = normalizeCollection(el.group.notes);
          // Ensure notes have valid structure
          const notes: NoteV2[] = rawNotes.map((n: any) => ({
             ...n,
             // Ensure required fields might need defaults if missing? 
             // current types seem fine provided they match NoteV2 shape
          }));
          
          return {
            ...el,
            group: {
              ...el.group,
              notes: notes
            }
          };
       }
       return el;
    });

    return {
      ...m,
      elements
    };
  });

  return {
    ...data,
    measures
  };
};
