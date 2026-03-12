import React, { useRef } from "react";
import type { Measure, NoteV2 } from "../../types";
import Note from "../Note";
import "./Measure.css";

type MeasureProps = {
  measure: Measure;
  measureIdx: number;
  onMeasureChange: (idx: number, newMeasure: Measure) => void;
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string, note: NoteV2, onChange: (note: NoteV2) => void) => void;
  editingNoteId: string | null;
  onLyricEditStart: (noteId: string) => void;
  onLyricSave: (noteId: string, lyric: string) => void;
  onLyricTabNext: (noteId: string, lyric: string) => void;
};

const MeasureView: React.FC<MeasureProps> = ({ measure, measureIdx, onMeasureChange, selectedNoteId, onNoteSelect, editingNoteId, onLyricEditStart, onLyricSave, onLyricTabNext }) => {
  const measureRef = useRef<HTMLDivElement>(null);

  const isMeasureActive = selectedNoteId === `measure-${measureIdx}`;
  const hasNotes = measure.elements.some(el => el.type === 'group' && el.group.notes.length > 0);

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
                    <div key={noteIdx} id={noteId}>
                      <Note
                        note={n}
                        onSelect={() => onNoteSelect(noteId, n, handleNoteUpdate)}
                        isSelected={selectedNoteId === noteId}
                        isEditingLyric={editingNoteId === noteId}
                        onLyricEditStart={() => onLyricEditStart(noteId)}
                        onLyricSave={(lyric) => onLyricSave(noteId, lyric)}
                        onLyricTabNext={(lyric) => onLyricTabNext(noteId, lyric)}
                      />
                    </div>
                  );
                })}
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
