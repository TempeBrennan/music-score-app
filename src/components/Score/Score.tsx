import { forwardRef, useImperativeHandle } from "react";
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
const Score = forwardRef<ScoreHandle, ScoreProps>(({ song, onSongChange, selectedNoteId, onNoteSelect }, ref) => {
  useImperativeHandle(ref, () => ({
    exportData: () => song,
  }), [song]);
  function changeMeasureAt(idx: number, newMeasure: Measure) {
    const measuresNew = [...song.measures];
    measuresNew[idx] = newMeasure;
    onSongChange({ ...song, measures: measuresNew });
  }

  return (
    <div className="score">
      {song.title && (
        <div className="score-header">
          <h1 className="score-title">{song.title}</h1>
          {song.originalArtist && <div className="score-artist">{song.originalArtist}</div>}
        </div>
      )}
      <div className="score-measures">
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
      </div>
    </div>
  );
});

export default Score;
