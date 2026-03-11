import React, { useState, useEffect } from "react";
import type { NoteV2 } from "../../types";
import { Accidental as AccidentalEnum, Duration as DurationEnum, Degree } from "../../types";
import "./NoteToolbar.css";

type QuickInputConfig = {
  pitch: number | string;
  duration: 1 | 2 | 4 | 8 | 16;
  octaveShift: number;
  dotted: boolean;
  alter: number;
};

type NoteToolbarProps = {
  onQuickInputConfigChange?: (config: QuickInputConfig) => void;
  selectedNote?: NoteV2 | null;
  onUpdateSelectedNote?: (note: NoteV2) => void;
  onAppendNote?: () => void;
  onDeleteNote?: () => void;
};

const NoteToolbar: React.FC<NoteToolbarProps> = ({ 
  onQuickInputConfigChange,
  selectedNote,
  onUpdateSelectedNote,
  onAppendNote,
  onDeleteNote
}) => {
  const [selectedPitch, setSelectedPitch] = useState<number | string>(1);
  const [alter, setAlter] = useState<number>(0);
  const [octaveShift, setOctaveShift] = useState<number>(0);
  const [duration, setDuration] = useState<1 | 2 | 4 | 8 | 16>(4);
  const [dotted, setDotted] = useState<boolean>(false);
  const [tieStart, setTieStart] = useState<boolean>(false);
  const [tieEnd, setTieEnd] = useState<boolean>(false);

  useEffect(() => {
    if (selectedNote) {
      setSelectedPitch(selectedNote.degree ?? 1);
      
      const alterVal = selectedNote.accidental === AccidentalEnum.Sharp ? 1 : 
                       selectedNote.accidental === AccidentalEnum.Flat ? -1 : 0;
      setAlter(alterVal);
      
      setOctaveShift(selectedNote.octaveShift ?? 0);
      
      const rev: Record<string, 1 | 2 | 4 | 8 | 16> = {
        [DurationEnum.Whole]: 1,
        [DurationEnum.Half]: 2,
        [DurationEnum.Quarter]: 4,
        [DurationEnum.Eighth]: 8,
        [DurationEnum.Sixteenth]: 16,
      };
      setDuration(rev[selectedNote.duration] ?? 4);
      
      setDotted(!!selectedNote.dotted);
      setTieStart(!!selectedNote.tieStart);
      setTieEnd(!!selectedNote.tieEnd);
    }
  }, [selectedNote]);

  useEffect(() => {
    if (onQuickInputConfigChange) {
      onQuickInputConfigChange({
        pitch: selectedPitch,
        duration,
        octaveShift,
        dotted,
        alter,
      });
    }
  }, [selectedPitch, duration, octaveShift, dotted, alter, onQuickInputConfigChange]);

  const updateSelectedNote = (updates: Partial<{
    pitch: number | string;
    alter: number;
    octaveShift: number;
    duration: 1 | 2 | 4 | 8 | 16;
    dotted: boolean;
    tieStart: boolean;
    tieEnd: boolean;
  }>) => {
    // If no note is selected or no update handler is provided, do nothing
    if (!selectedNote || !onUpdateSelectedNote) return;

    // Calculate new values, falling back to current state if not provided in updates
    const newPitch = updates.pitch !== undefined ? updates.pitch : selectedPitch;
    const newAlter = updates.alter !== undefined ? updates.alter : alter;
    const newOctaveShift = updates.octaveShift !== undefined ? updates.octaveShift : octaveShift;
    const newDuration = updates.duration !== undefined ? updates.duration : duration;
    const newDotted = updates.dotted !== undefined ? updates.dotted : dotted;
    const newTieStart = updates.tieStart !== undefined ? updates.tieStart : tieStart;
    const newTieEnd = updates.tieEnd !== undefined ? updates.tieEnd : tieEnd;

    const durationMap: Record<number, DurationEnum> = {
      1: DurationEnum.Whole,
      2: DurationEnum.Half,
      4: DurationEnum.Quarter,
      8: DurationEnum.Eighth,
      16: DurationEnum.Sixteenth,
    };
    
    const accidental = newAlter === 1 ? AccidentalEnum.Sharp : 
                       newAlter === -1 ? AccidentalEnum.Flat : 
                       AccidentalEnum.Natural;
    
    const updated: NoteV2 = {
      ...selectedNote,
      degree: newPitch as Degree,
      accidental: accidental,
      duration: durationMap[newDuration],
      dotted: newDotted || undefined,
      octaveShift: newOctaveShift !== 0 ? newOctaveShift : undefined,
      tieStart: newTieStart || undefined,
      tieEnd: newTieEnd || undefined,
    };
    
    onUpdateSelectedNote(updated);
  };

  const handlePitchChange = (pitch: number | string) => {
    setSelectedPitch(pitch);
    updateSelectedNote({ pitch });
  };

  const handleAlterChange = (newAlter: number) => {
    setAlter(newAlter);
    updateSelectedNote({ alter: newAlter });
  };

  const handleDurationChange = (newDuration: 1 | 2 | 4 | 8 | 16) => {
    setDuration(newDuration);
    updateSelectedNote({ duration: newDuration });
  };

  const handleDottedChange = (newDotted: boolean) => {
    setDotted(newDotted);
    updateSelectedNote({ dotted: newDotted });
  };

  const handleOctaveShiftChange = (newOctaveShift: number) => {
    setOctaveShift(newOctaveShift);
    updateSelectedNote({ octaveShift: newOctaveShift });
  };



  return (
    <div className="note-toolbar">
      <h4>🎵 音符面板</h4>
      
      <button 
        className="append-note-btn" 
        onClick={onAppendNote}
        title="在选中音符之后追加新音符"
        disabled={!selectedNote}
      >
        ➕ 追加音符
      </button>
      <button 
        className="delete-note-btn" 
        onClick={onDeleteNote}
        title="删除选中的音符"
        disabled={!selectedNote}
      >
        🗑️ 删除音符
      </button>

      <div className="pitch-selector">
        <h5>音高</h5>
        <div className="pitch-buttons">
          {[0, 1, 2, 3, 4, 5, 6, 7, '-'].map((pitch) => (
            <button
              key={pitch}
              className={`pitch-btn ${selectedPitch === pitch ? 'active' : ''}`}
              onClick={() => handlePitchChange(pitch)}
            >
              {pitch}
            </button>
          ))}
        </div>
      </div>

      <fieldset>
        <legend>升降号</legend>
        <label>
          <input
            type="radio"
            name="alter"
            checked={alter === 0}
            onChange={() => handleAlterChange(0)}
          />
          <span>♮ 还原</span>
        </label>
        <label>
          <input
            type="radio"
            name="alter"
            checked={alter === 1}
            onChange={() => handleAlterChange(1)}
          />
          <span>♯ 升号</span>
        </label>
        <label>
          <input
            type="radio"
            name="alter"
            checked={alter === -1}
            onChange={() => handleAlterChange(-1)}
          />
          <span>♭ 降号</span>
        </label>
      </fieldset>
      <fieldset>
        <legend>时值</legend>
        <label>
          <input
            type="radio"
            name="duration"
            checked={duration === 16}
            onChange={() => handleDurationChange(16)}
          />
          <span>十六分</span>
        </label>
        <label>
          <input
            type="radio"
            name="duration"
            checked={duration === 8}
            onChange={() => handleDurationChange(8)}
          />
          <span>八分</span>
        </label>
        <label>
          <input
            type="radio"
            name="duration"
            checked={duration === 4}
            onChange={() => handleDurationChange(4)}
          />
          <span>四分</span>
        </label>
        <label>
          <input
            type="radio"
            name="duration"
            checked={duration === 2}
            onChange={() => handleDurationChange(2)}
          />
          <span>二分</span>
        </label>
        <label>
          <input
            type="radio"
            name="duration"
            checked={duration === 1}
            onChange={() => handleDurationChange(1)}
          />
          <span>全音符</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>附点</legend>
        <label>
          <input
            type="radio"
            name="dotted"
            checked={!dotted}
            onChange={() => handleDottedChange(false)}
          />
          <span>无</span>
        </label>
        <label>
          <input
            type="radio"
            name="dotted"
            checked={dotted}
            onChange={() => handleDottedChange(true)}
          />
          <span>附点 ·</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>八度偏移</legend>
        <div className="octave-shift-controls">
          <button
            className={`octave-btn ${octaveShift === -2 ? 'active' : ''}`}
            onClick={() => handleOctaveShiftChange(-2)}
            title="降低两个八度"
          >
            :↓
          </button>
          <button
            className={`octave-btn ${octaveShift === -1 ? 'active' : ''}`}
            onClick={() => handleOctaveShiftChange(-1)}
            title="降低一个八度"
          >
            ·↓
          </button>
          <button
            className={`octave-btn ${octaveShift === 0 ? 'active' : ''}`}
            onClick={() => handleOctaveShiftChange(0)}
            title="原始八度"
          >
            0
          </button>
          <button
            className={`octave-btn ${octaveShift === 1 ? 'active' : ''}`}
            onClick={() => handleOctaveShiftChange(1)}
            title="升高一个八度"
          >
            ·↑
          </button>
          <button
            className={`octave-btn ${octaveShift === 2 ? 'active' : ''}`}
            onClick={() => handleOctaveShiftChange(2)}
            title="升高两个八度"
          >
            :↑
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend>延音线</legend>
        <label>
          <input
            type="radio"
            name="tie"
            checked={!tieStart && !tieEnd}
            onChange={() => {
              setTieStart(false);
              setTieEnd(false);
              updateSelectedNote({ tieStart: false, tieEnd: false });
            }}
          />
          <span>无</span>
        </label>
        <label>
          <input
            type="radio"
            name="tie"
            checked={tieStart}
            onChange={() => {
              setTieStart(true);
              setTieEnd(false);
              updateSelectedNote({ tieStart: true, tieEnd: false });
            }}
          />
          <span>延音起始 ⌢</span>
        </label>
        <label>
          <input
            type="radio"
            name="tie"
            checked={tieEnd}
            onChange={() => {
              setTieStart(false);
              setTieEnd(true);
              updateSelectedNote({ tieStart: false, tieEnd: true });
            }}
          />
          <span>延音终止 ⌢</span>
        </label>
      </fieldset>
    </div>
  );
};

export default NoteToolbar;
