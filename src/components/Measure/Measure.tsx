import React, { useRef, useEffect, useState } from "react";
import type { Measure, NoteV2 } from "../../types";
import Note from "../Note";
import GroupLyricsEditor from "../GroupLyricsEditor";
import "./Measure.css";

type MeasureProps = {
  measure: Measure;
  measureIdx: number;
  onMeasureChange: (idx: number, newMeasure: Measure) => void;
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string, note: NoteV2, onChange: (note: NoteV2) => void) => void;
};

const MeasureView: React.FC<MeasureProps> = ({ measure, measureIdx, onMeasureChange, selectedNoteId, onNoteSelect }) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [ties, setTies] = useState<Array<{ startId: string; endId: string; startNote: NoteV2; endNote: NoteV2 }>>([]);
  const [editingLyricGroupIdx, setEditingLyricGroupIdx] = useState<number | null>(null);

  const isMeasureActive = selectedNoteId === `measure-${measureIdx}`;
  const hasNotes = measure.elements.some(el => el.type === 'group' && el.group.notes.length > 0);

  // 检测连音线配对
  useEffect(() => {
    const tieLinks: Array<{ startId: string; endId: string; startNote: NoteV2; endNote: NoteV2 }> = [];
    const allNotes: Array<{ id: string; note: NoteV2; elIdx: number; noteIdx: number }> = [];

    // 收集所有音符
    measure.elements.forEach((el, elIdx) => {
      if (el.type === 'group') {
        el.group.notes.forEach((n, noteIdx) => {
          const noteId = `measure-${measureIdx}-group-${elIdx}-note-${noteIdx}`;
          allNotes.push({ id: noteId, note: n, elIdx, noteIdx });
        });
      }
    });

    // 查找配对的连音线
    for (let i = 0; i < allNotes.length; i++) {
      if (allNotes[i].note.tieStart) {
        // 找到下一个有 tieEnd 的音符
        for (let j = i + 1; j < allNotes.length; j++) {
          if (allNotes[j].note.tieEnd) {
            tieLinks.push({
              startId: allNotes[i].id,
              endId: allNotes[j].id,
              startNote: allNotes[i].note,
              endNote: allNotes[j].note,
            });
            break;
          }
        }
      }
    }

    setTies(tieLinks);
  }, [measure, measureIdx]);

  const handleLyricSave = (elIdx: number, lyric: string) => {
    const newMeasure: Measure = JSON.parse(JSON.stringify(measure));
    if (newMeasure.elements[elIdx].type === 'group') {
      newMeasure.elements[elIdx].group.lyric = lyric || undefined;
    }
    onMeasureChange(measureIdx, newMeasure);
    setEditingLyricGroupIdx(null);
  };

  const handleLyricCancel = () => {
    setEditingLyricGroupIdx(null);
  };

  const measureClasses = [
    'measure',
    isMeasureActive ? 'active-input' : '',
    !hasNotes ? 'empty' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={measureClasses} ref={measureRef}>
      <div className="measure-content">
        {measure.elements.map((el, elIdx) => {
        if (el.type === "spacer") {
          return (
            <div className="measure-spacer" key={elIdx} style={{ width: el.width || 16 }} />
          );
        }

        const group = el.group;
        return (
          <div className="measure-group" key={elIdx}>
            <div className="group-notes">
              {group.notes.map((n, noteIdx) => {
                const noteId = `measure-${measureIdx}-group-${elIdx}-note-${noteIdx}`;
                const handleNoteUpdate = (updated: NoteV2) => {
                  const newMeasure: Measure = JSON.parse(JSON.stringify(measure));
                  if (newMeasure.elements[elIdx].type === 'group') {
                    newMeasure.elements[elIdx].group.notes[noteIdx] = updated;
                  }
                  onMeasureChange(measureIdx, newMeasure);
                };
                
                return (
                  <div
                    key={noteIdx}
                    ref={(el) => {
                      if (el) {
                        noteRefs.current.set(noteId, el);
                      } else {
                        noteRefs.current.delete(noteId);
                      }
                    }}
                  >
                    <Note
                      note={n}
                      onSelect={() => onNoteSelect(noteId, n, handleNoteUpdate)}
                      isSelected={selectedNoteId === noteId}
                    />
                  </div>
                );
              })}
            </div>
            <div className="group-lyric-container">
              {editingLyricGroupIdx === elIdx ? (
                <GroupLyricsEditor
                  lyric={group.lyric}
                  onSave={(lyric) => handleLyricSave(elIdx, lyric)}
                  onCancel={handleLyricCancel}
                />
              ) : (
                <div 
                  className={`group-lyric ${!group.lyric ? 'empty' : ''}`}
                  onClick={() => setEditingLyricGroupIdx(elIdx)}
                >
                  {group.lyric || '点击添加歌词'}
                </div>
              )}
            </div>
          </div>
        );
        })}
      </div>
      <div className="measure-divider" />
      
      {/* SVG overlay for tie lines */}
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
            const startEl = noteRefs.current.get(tie.startId);
            const endEl = noteRefs.current.get(tie.endId);

            if (!startEl || !endEl || !measureRef.current) return null;

            const measureRect = measureRef.current.getBoundingClientRect();
            const startRect = startEl.getBoundingClientRect();
            const endRect = endEl.getBoundingClientRect();

            const startX = startRect.left + startRect.width / 2 - measureRect.left;
            const endX = endRect.left + endRect.width / 2 - measureRect.left;

            // Determine if start/end notes have octave up dots
            const hasStartOctaveUp = (tie.startNote.octaveShift || 0) > 0;
            const hasEndOctaveUp = (tie.endNote.octaveShift || 0) > 0;
            const maxOctaveUp = Math.max((tie.startNote.octaveShift || 0), (tie.endNote.octaveShift || 0));

            // Adjust vertical position
            // Notes without octave dots start lower (closer to number)
            const startYOffset = hasStartOctaveUp ? 0 : 10;
            const endYOffset = hasEndOctaveUp ? 0 : 10;

            const startY = startRect.top - measureRect.top + startYOffset;
            const endY = endRect.top - measureRect.top + endYOffset;
            
            // Calculate control point height based on the highest point (min Y)
            // If octave shift is large (e.g. 2), we need even more clearance
            const baseClearance = 20;
            const octaveClearance = maxOctaveUp > 0 ? (maxOctaveUp * 8) : 0; // More lift for higher octaves
            
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
  );
};

export default MeasureView;
