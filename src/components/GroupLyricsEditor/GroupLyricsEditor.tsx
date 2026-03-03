import { useState } from "react";
import "./GroupLyricsEditor.css";

type GroupLyricsEditorProps = {
  lyric: string | undefined;
  onSave: (lyric: string) => void;
  onCancel: () => void;
};

const GroupLyricsEditor: React.FC<GroupLyricsEditorProps> = ({ lyric, onSave, onCancel }) => {
  const [value, setValue] = useState(lyric || "");

  const handleSave = () => {
    onSave(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="group-lyrics-editor">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        placeholder="输入歌词"
        autoFocus
        className="lyric-input"
      />
      <div className="editor-buttons">
        <button onMouseDown={(e) => e.preventDefault()} onClick={handleSave} className="btn-save">✓</button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={onCancel} className="btn-cancel">✕</button>
      </div>
    </div>
  );
};

export default GroupLyricsEditor;
