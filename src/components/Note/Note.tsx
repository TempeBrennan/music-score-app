import React, { useState, useEffect } from "react";
import { NoteV2, Duration, Accidental, Degree } from "../../types";
import "./Note.css";

type NoteProps = {
  note: NoteV2;
  onSelect: () => void;
  isSelected: boolean;
  isEditingLyric?: boolean;
  onLyricEditStart?: () => void;
  onLyricSave?: (lyric: string) => void;
  onLyricTabNext?: (lyric: string) => void;
};

const Note: React.FC<NoteProps> = ({ note, onSelect, isSelected, isEditingLyric, onLyricEditStart, onLyricSave, onLyricTabNext }) => {
  const [lyricInput, setLyricInput] = useState(note.lyric || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingLyric) {
      setLyricInput(note.lyric || "");
      // 在下一帧 select all
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [isEditingLyric]);

  const pitchDisplay = String(note.degree);
  const underlines = (() => {
    if (note.duration === Duration.Eighth) return 1;
    if (note.duration === Duration.Sixteenth) return 2;
    return 0;
  })();

  const getAlterSymbol = () => {
    if (note.accidental === Accidental.Sharp) return '♯';
    if (note.accidental === Accidental.Flat) return '♭';
    return null;
  };

  const alterSymbol = getAlterSymbol();
  const octaveShift = note.octaveShift ?? 0;
  const isExtend = note.degree === Degree.Extend;

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLyricEditStart?.();
  };

  const handleLyricKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onLyricSave?.(lyricInput);
    } else if (e.key === "Tab") {
      e.preventDefault();
      onLyricTabNext?.(lyricInput);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onLyricSave?.(note.lyric || "");
    }
  };

  return (
    <div
      className={`note-wrapper ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
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

      {/* 歌词区域（增时线保留占位保证高度一致） */}
      <div className="note-lyric-area">
        {!isExtend && (isEditingLyric ? (
          <input
            ref={inputRef}
            className="note-lyric-input"
            value={lyricInput}
            onChange={e => setLyricInput(e.target.value)}
            onKeyDown={handleLyricKeyDown}
            onBlur={() => onLyricSave?.(lyricInput)}
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="note-lyric-text">{note.lyric || ''}</span>
        ))}
      </div>
    </div>
  );
};

export default Note;
