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
  const [editingLyricGroupIdx, setEditingLyricGroupIdx] = useState<number | null>(null);

  const isMeasureActive = selectedNoteId === `measure-${measureIdx}`;
  const hasNotes = measure.elements.some(el => el.type === 'group' && el.group.notes.length > 0);

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
                    id={noteId}
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
    </div>
  );
};

export default MeasureView;
