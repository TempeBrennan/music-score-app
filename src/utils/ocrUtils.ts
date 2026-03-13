// Convert AI OCR JSON format to App Measure format
import { Measure, MeasureElement, Group, NoteV2, Degree, Accidental, Duration, Spacer } from '../types';

export function convertOCRToMeasure(ocrData: any): Measure | null {
  try {
    console.log('[ocrUtils] received data:', JSON.stringify(ocrData, null, 2));
    // 1. Validate basic structure
    const measureData = ocrData?.measure;
    if (!measureData || !measureData.elements) {
      console.error("Invalid OCR data: missing measure or elements");
      console.error("  ocrData keys:", ocrData ? Object.keys(ocrData) : '(null/undefined)');
      console.error("  measureData:", measureData);
      return null;
    }

    const elements: MeasureElement[] = [];
    const elementsObj = measureData.elements;

    // The AI returns an object with numeric keys "0", "1"... 
    // We should sort them to ensure order
    const sortedKeys = Object.keys(elementsObj).sort((a, b) => parseInt(a) - parseInt(b));

    for (const key of sortedKeys) {
      const elData = elementsObj[key];
      
      if (elData.type === 'group' && elData.group) {
        const groupData = elData.group;
        const notes: NoteV2[] = [];
        
        if (groupData.notes) {
          const noteKeys = Object.keys(groupData.notes).sort((a, b) => parseInt(a) - parseInt(b));
          
          for (const nKey of noteKeys) {
            const nData = groupData.notes[nKey];
            
            // Map Degree
            // AI returns 0-7 number. App uses Degree enum (Pause=0, C=1...)
            // Fortunately they match exactly 
            const degree = nData.degree as Degree;

            // Map Accidental
            // AI: "natural", "sharp", "flat"
            // App: Accidental.Natural ("natural"), Accidental.Sharp ("sharp"), Accidental.Flat ("flat")
            // Matches exactly too!
            let accidental = Accidental.Natural;
            if (nData.accidental === 'sharp') accidental = Accidental.Sharp;
            if (nData.accidental === 'flat') accidental = Accidental.Flat;

            // Map Duration
            // AI: "quarter", "eighth", "sixteenth", "half", "whole"
            // App Duration enum uses same strings
            const duration = nData.duration as string; // Cast to string first to match enum if needed, but enum values are strings
            
            // Map duration string to enum
            let durationEnum = Duration.Quarter;
            if (duration === 'whole') durationEnum = Duration.Whole;
            else if (duration === 'half') durationEnum = Duration.Half;
            else if (duration === 'quarter') durationEnum = Duration.Quarter;
            else if (duration === 'eighth') durationEnum = Duration.Eighth;
            else if (duration === 'sixteenth') durationEnum = Duration.Sixteenth;

            // AI 有时会返回 "Extend" 字符串而非 "-"，在此做安全映射
            const rawDegree = nData.degree === 'Extend' ? Degree.Extend : nData.degree;

            const note: NoteV2 = {
              degree: rawDegree,
              accidental: nData.accidental === 'sharp' ? Accidental.Sharp : 
                          nData.accidental === 'flat' ? Accidental.Flat : Accidental.Natural,
              duration: durationEnum,
              dotted: !!nData.dotted,
              octaveShift: nData.octaveShift,
              tieStart: !!nData.tieStart,
              tieEnd: !!nData.tieEnd,
              lyric: nData.lyric || undefined
            };
            notes.push(note);
          }
        }

        const groupKey = key; // Use key if needed, or just iterate
        const group: Group = {
          notes,
        };

        elements.push({ type: 'group', group });
      } else if (elData.type === 'spacer') {
         // Handle spacer if the AI ever outputs it (prompt doesn't explicitly ask for it but good to be safe)
         elements.push({ type: 'spacer', width: (elData as any).width || 10 });
      }
    }

    return {
      elements
    };

  } catch (err) {
    console.error("Error converting OCR data:", err);
    return null;
  }
}
