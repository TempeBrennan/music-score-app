import React, { forwardRef, useImperativeHandle, useEffect, useState, useRef } from "react";
import { Song, Measure, NoteV2 } from "../../types";
import MeasureView from "../Measure/Measure";
import "./Score.css";

export type ScoreHandle = { exportData: () => Song };

type ScoreProps = {
  song: Song;
  onSongChange: (val: Song) => void;
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string, note: NoteV2, onChange: (note: NoteV2) => void) => void;
};
const Score = forwardRef(
  ({ song, onSongChange, selectedNoteId, onNoteSelect }: ScoreProps, ref: React.ForwardedRef<ScoreHandle>) => {
  useImperativeHandle(ref, () => ({
    exportData: () => song,
  }), [song]);

  const scoreRef = useRef<HTMLDivElement>(null);
  const [ties, setTies] = useState<Array<{ startId: string; endId: string; startNote: NoteV2; endNote: NoteV2 }>>([]);

  // Trigger tie re-calculation on song change or window resize
  useEffect(() => {
    const calculateTies = () => {
      // Allow React to flush DOM updates first
      requestAnimationFrame(() => {
        // Flatten all notes from all measures globally
        const allNotes: Array<{ id: string; note: NoteV2 }> = [];
        song.measures.forEach((m, mIdx) => {
          m.elements.forEach((el, elIdx) => {
            if (el.type === 'group' && el.group.notes) {
              el.group.notes.forEach((n, nIdx) => {
                allNotes.push({ id: `measure-${mIdx}-group-${elIdx}-note-${nIdx}`, note: n });
              });
            }
          });
        });

        const tieLinks = [];
        for (let i = 0; i < allNotes.length; i++) {
          if (allNotes[i].note.tieStart) {
            // find next tieEnd across ALL measures
            for (let j = i + 1; j < allNotes.length; j++) {
              if (allNotes[j].note.tieEnd) {
                tieLinks.push({
                  startId: allNotes[i].id,
                  endId: allNotes[j].id,
                  startNote: allNotes[i].note,
                  endNote: allNotes[j].note
                });
                break;
              }
            }
          }
        }
        setTies(tieLinks);
      });
    };

    calculateTies();
    
    // In order to update the SVG paths when window resizes and re-flows DOM elements
    window.addEventListener('resize', calculateTies);
    return () => window.removeEventListener('resize', calculateTies);
  }, [song]);

  function changeMeasureAt(idx: number, newMeasure: Measure) {
    const measuresNew = [...song.measures];
    measuresNew[idx] = newMeasure;
    onSongChange({ ...song, measures: measuresNew });
  }

  return (
    <div className="score" ref={scoreRef}>
      {song.title && (
        <div className="score-header">
          <h1 className="score-title">{song.title}</h1>
          {song.originalArtist && <div className="score-artist">{song.originalArtist}</div>}
        </div>
      )}
      <div className="score-measures" style={{ position: 'relative' }}>
        {song.measures.map((m, idx) => (
          <MeasureView
            key={idx}
            measure={m}
            measureIdx={idx}
            onMeasureChange={changeMeasureAt}
            selectedNoteId={selectedNoteId}
            onNoteSelect={onNoteSelect}
          />
        ))}

        {/* Global SVG overlay for tie lines across all measures */}
        {ties.length > 0 && (
          <svg
            className="tie-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            {ties.map((tie, idx) => {
              const startEl = document.getElementById(tie.startId);
              const endEl = document.getElementById(tie.endId);

              // parent coordinate reference
              const containerEl = scoreRef.current?.querySelector('.score-measures');
              
              if (!startEl || !endEl || !containerEl) return null;

              const containerRect = containerEl.getBoundingClientRect();
              const startRect = startEl.getBoundingClientRect();
              const endRect = endEl.getBoundingClientRect();

              const startX = startRect.left + startRect.width / 2 - containerRect.left;
              const endX = endRect.left + endRect.width / 2 - containerRect.left;

              // Determine if start/end notes have octave up dots
              const hasStartOctaveUp = (tie.startNote.octaveShift || 0) > 0;
              const hasEndOctaveUp = (tie.endNote.octaveShift || 0) > 0;

              const startYOffset = hasStartOctaveUp ? 0 : 10;
              const endYOffset = hasEndOctaveUp ? 0 : 10;

              const startY = startRect.top - containerRect.top + startYOffset;
              const endY = endRect.top - containerRect.top + endYOffset;

              // Detect cross-row: if the end note is on a different row (Y differs significantly)
              const isCrossRow = Math.abs(endRect.top - startRect.top) > 20;

              if (isCrossRow) {
                // Draw two half-arcs: one trailing from start, one leading into end
                // Each arc is a fixed length relative to its own note, symmetric in shape
                const arcSpan = 40; // horizontal half-arc width
                const clearance = 16;

                const startClearance = clearance + ((tie.startNote.octaveShift || 0) > 0 ? (tie.startNote.octaveShift || 0) * 8 : 0);
                const endClearance = clearance + ((tie.endNote.octaveShift || 0) > 0 ? (tie.endNote.octaveShift || 0) * 8 : 0);

                // Half-arc 1: from tieStart note, arcs rightward and lands back at same Y
                const p1 = `M ${startX} ${startY} Q ${startX + arcSpan / 2} ${startY - startClearance} ${startX + arcSpan} ${startY}`;
                // Half-arc 2: comes from left of tieEnd note, arcs down to land on the note
                const p2 = `M ${endX - arcSpan} ${endY} Q ${endX - arcSpan / 2} ${endY - endClearance} ${endX} ${endY}`;

                return (
                  <g key={idx}>
                    <path d={p1} fill="none" stroke="#222" strokeWidth="1.5" style={{ vectorEffect: 'non-scaling-stroke' }} />
                    <path d={p2} fill="none" stroke="#222" strokeWidth="1.5" style={{ vectorEffect: 'non-scaling-stroke' }} />
                  </g>
                );
              }

              // Same-row: draw a single arc as before
              const maxOctaveUp = Math.max((tie.startNote.octaveShift || 0), (tie.endNote.octaveShift || 0));
              const baseClearance = 20;
              const octaveClearance = maxOctaveUp > 0 ? (maxOctaveUp * 8) : 0;
              const minY = Math.min(startY, endY);
              const controlY = minY - baseClearance - octaveClearance;
              const path = `M ${startX} ${startY} Q ${(startX + endX) / 2} ${controlY} ${endX} ${endY}`;

              return (
                <path
                  key={idx}
                  d={path}
                  fill="none"
                  stroke="#222"
                  strokeWidth="1.5"
                  style={{ vectorEffect: 'non-scaling-stroke' }} 
                />
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
});

export default Score;
