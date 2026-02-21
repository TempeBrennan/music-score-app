1. TypeScript 数据结构定义
ts
// types.ts
export type Note = {
  pitch: number;                 // 0~7, 0为休止符
  duration: 1 | 2 | 4 | 8 | 16;  // 音符时值
  octaveShift?: number;          // 八度变化: +1、-1等
  dotted?: boolean;              // 附点
  tieToNext?: boolean;           // 连音线
  lyric?: string;                // 歌词
};

export type Bar = {
  notes: Note[];
  endingDoubleBar?: boolean;
};

export type Row = {
  bars: Bar[];
};

export type Page = {
  rows: Row[];
};

export type Score = {
  pages: Page[];
  title?: string;
};
2. 组件代码样本
2.1 Note 编辑框组件（浮层）
tsx
// NoteEditor.tsx
import React, { useState } from "react";
import type { Note } from "./types";

interface NoteEditorProps {
  note: Note;
  onChange: (newNote: Note) => void;
  onClose: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onChange, onClose }) => {
  // 简单实现
  const [pitch, setPitch] = useState(note.pitch);
  const [duration, setDuration] = useState(note.duration);
  const [octaveShift, setOctaveShift] = useState(note.octaveShift || 0);
  const [dotted, setDotted] = useState(note.dotted || false);
  const [tieToNext, setTieToNext] = useState(note.tieToNext || false);

  function handleSave() {
    onChange({
      ...note,
      pitch,
      duration,
      octaveShift,
      dotted,
      tieToNext
    });
    onClose();
  }

  return (
    <div className="note-editor-float">
      <label>音高: <input type="number" min="0" max="7" value={pitch} onChange={e => setPitch(Number(e.target.value))} /></label>
      <label>时值:
        <select value={duration} onChange={e => setDuration(Number(e.target.value) as any)}>
          <option value={1}>全音符</option>
          <option value={2}>二分音符</option>
          <option value={4}>四分音符</option>
          <option value={8}>八分音符</option>
          <option value={16}>十六分音符</option>
        </select>
      </label>
      <label>八度：<input type="number" value={octaveShift} onChange={e => setOctaveShift(Number(e.target.value))} /></label>
      <label>附点: <input type="checkbox" checked={dotted} onChange={e => setDotted(e.target.checked)} /></label>
      <label>连音: <input type="checkbox" checked={tieToNext} onChange={e => setTieToNext(e.target.checked)} /></label>
      <button onClick={handleSave}>保存</button>
      <button onClick={onClose}>取消</button>
    </div>
  );
};

export default NoteEditor;
2.2 Note 组件
tsx
// Note.tsx
import React, { useState } from "react";
import type { Note as INote } from "./types";
import NoteEditor from "./NoteEditor";

type NoteProps = {
  note: INote;
  onNoteChange: (newNote: INote) => void;
};

const Note: React.FC<NoteProps> = ({ note, onNoteChange }) => {
  const [editing, setEditing] = useState(false);

  const pitchDisplay = note.pitch === 0 ? "·" : note.pitch;
  const dashes = (() => {
    if (note.duration === 8) return [1];
    if (note.duration === 16) return [1, 2];
    return [];
  })();
  // 八度圆点
  const dotsUp = note.octaveShift && note.octaveShift > 0 ? [...Array(note.octaveShift)].map((_, i) => <div key={i} className="dot dot-up" />) : null;
  const dotsDown = note.octaveShift && note.octaveShift < 0 ? [...Array(-note.octaveShift)].map((_, i) => <div key={i} className="dot dot-down" />) : null;

  return (
    <div className="note" onClick={() => setEditing(true)}>
      <div className="dots-up">{dotsUp}</div>
      <div className="note-main">
        <span className="note-pitch">{pitchDisplay}</span>
        {note.dotted && <span className="dot dot-right"></span>}
      </div>
      <div className="dots-down">{dotsDown}</div>
      <div className="note-dash">
        {dashes.map((x, i) => <div key={i} className="note-underline" />)}
      </div>
      {editing && <NoteEditor note={note} onChange={onNoteChange} onClose={() => setEditing(false)} />}
    </div>
  );
};

export default Note;
2.3 Bar 组件
tsx
// Bar.tsx
import React from "react";
import type { Bar as IBar, Note as INote } from "./types";
import Note from "./Note";

type BarProps = {
  bar: IBar;
  onBarChange: (bar: IBar) => void;
};

const Bar: React.FC<BarProps> = ({ bar, onBarChange }) => {
  function changeNoteAt(idx: number, newNote: INote) {
    const notesNew = [...bar.notes];
    notesNew[idx] = newNote;
    onBarChange({ ...bar, notes: notesNew });
  }
  return (
    <div className="bar">
      {bar.notes.map((note, idx) =>
        <Note note={note} key={idx} onNoteChange={newNote => changeNoteAt(idx, newNote)} />
      )}
      <div className={bar.endingDoubleBar ? "bar-line-double" : "bar-line"} />
    </div>
  );
};

export default Bar;
2.4 Row/Page/Score 组件同理（实现递归结构）
下面是 Score 的顶层示例，省略部分提交：

tsx
// Score.tsx
import React, { useState } from "react";
import { Score as IScore, Page as IPage, Row as IRow, Bar as IBar } from "./types";
import Bar from "./Bar";

type ScoreProps = {
  score: IScore;
  onScoreChange: (val: IScore) => void;
};

const Score: React.FC<ScoreProps> = ({ score, onScoreChange }) => {
  // 简化，每页一行，每行一小节举例
  function onBarChange(pageIdx: number, rowIdx: number, barIdx: number, newBar: IBar) {
    const pagesNew = [...score.pages];
    pagesNew[pageIdx].rows[rowIdx].bars[barIdx] = newBar;
    onScoreChange({ ...score, pages: pagesNew });
  }
  return (
    <div className="score">
      <h2>{score.title}</h2>
      {score.pages.map((page, pageIdx) => (
        <div className="score-page" key={pageIdx}>
          {page.rows.map((row, rowIdx) => (
            <div className="score-row" key={rowIdx}>
              {row.bars.map((bar, barIdx) => (
                <Bar
                  bar={bar}
                  key={barIdx}
                  onBarChange={newBar => onBarChange(pageIdx, rowIdx, barIdx, newBar)}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Score;
3. 一些样式建议（可放到样式文件）
css
.score-page {
  width: 794px; min-height: 1123px; margin: 0 auto;
  background: white; box-shadow: 0 0 8px #ddd; padding: 32px 24px;
}
.score-row { display: flex; margin-bottom: 18px; }
.bar { display: flex; align-items: flex-end; position: relative; padding-right: 16px; border-right: 2px solid #888;}
.bar-line { border-right:2px solid #888; position: absolute; right:0; top:0; bottom:0;}
.bar-line-double { border-right: 6px double #000; position: absolute; right:0; top:0; bottom:0;}
.note { display: flex; flex-direction: column; align-items: center; margin: 0 10px; cursor: pointer;}
.note-pitch { font-size: 24px; }
.dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #222; margin: 1px;}
.dot-up { margin-bottom:2px;}
.dot-down { margin-top:2px;}
.dot-right { margin-left:6px;}
.note-underline { width:20px; height:2px; background:#222; margin-top:2px;}
.note-editor-float { position:absolute; z-index:1000; background:#fff; border:1px solid #aaa; padding:10px;}
4. 在App中引用（简单例子）
tsx
import React, { useState } from "react";
import Score from "./Score";
import { Score as IScore } from "./types";

const demoScore: IScore = {
  title: "我的简谱",
  pages: [{
    rows: [{
      bars: [{
        notes: [
          { pitch: 1, duration: 4 },
          { pitch: 2, duration: 8, dotted: true, octaveShift: 1 },
          { pitch: 3, duration: 8, tieToNext: true },
          { pitch: 3, duration: 4 },
        ]
      }]
    }]
  }]
};

function App() {
  const [score, setScore] = useState<IScore>(demoScore);

  return (
    <Score score={score} onScoreChange={setScore} />
  );
}

export default App;