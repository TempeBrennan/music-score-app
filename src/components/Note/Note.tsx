import React from "react";
import { NoteV2, Duration, Accidental } from "../../types";
import "./Note.css";

type NoteProps = {
  note: NoteV2;
  onSelect: () => void;
  isSelected: boolean;
};

const Note: React.FC<NoteProps> = ({ note, onSelect, isSelected }) => {
  // 当音符为休止符(0)时，显示短杠(-)
  const pitchDisplay = String(note.degree);
  const underlines = (() => {
    if (note.duration === Duration.Eighth) {
      return 1;
    }
    if (note.duration === Duration.Sixteenth) {
      return 2;
    }
    return 0;
  })();

  const getAlterSymbol = () => {
    if (note.accidental === Accidental.Sharp) {
      return '♯';
    }
    if (note.accidental === Accidental.Flat) {
      return '♭';
    }
    // 还原号不显示
    return null;
  };

  const alterSymbol = getAlterSymbol();
  const octaveShift = note.octaveShift ?? 0;

  return (
    <div className={`note-wrapper ${isSelected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="note">
        {/* 顶部：升高八度的圆点 */}
        <div className="octave-up">
          {octaveShift > 0 && [...Array(octaveShift)].map((_, i) => (
            <div key={i} className="octave-dot" />
          ))}
        </div>

        {/* 中间：音符主体（左上角升降号 + 中间数字 + 右侧附点） */}
        <div className="note-main">
          {alterSymbol && <span className="alter-symbol">{alterSymbol}</span>}
          <span className="note-pitch">{pitchDisplay}</span>
          {note.dotted && <span className="dotted-dot" />}
        </div>

        {/* 底部：降低八度的圆点 */}
        <div className="octave-down">
          {octaveShift < 0 && [...Array(Math.abs(octaveShift))].map((_, i) => (
            <div key={i} className="octave-dot" />
          ))}
        </div>

        {/* 最底部：时值下划线 */}
        <div className="note-underlines">
          {[...Array(underlines)].map((_, i) => (
            <div key={i} className="note-underline" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Note;
