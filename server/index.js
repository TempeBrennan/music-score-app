const express = require('express');
const cors = require('cors');
const db = require('./database');
const StandardMusicXMLGenerator = require('./musicxmlGenerator');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Helper to convert React-Music NoteV2 to MusicXML NoteData
function convertToXmlData(song) {
  const measures = [];
  
  if (!song || !song.measures) return measures;

  // Key Signature processing
  const keySig = song.keySignature || "C";
  // Default base octave to 4 (e.g. C4, G4) if not provided
  const baseOctave = song.baseOctave !== undefined ? song.baseOctave : 4;  
  
  // Base Diatonic Steps (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
  // Semitones from C (C=0, D=2, E=4, F=5, G=7, A=9, B=11)
  const stepToSemitone = [0, 2, 4, 5, 7, 9, 11];

  const keyRootMap = {
      'C': {step: 0, alter: 0},
      'G': {step: 4, alter: 0},
      'D': {step: 1, alter: 0},
      'A': {step: 5, alter: 0},
      'E': {step: 2, alter: 0},
      'B': {step: 6, alter: 0},
      'F#': {step: 3, alter: 1},
      'C#': {step: 0, alter: 1}, 
      'F': {step: 3, alter: 0},
      'Bb': {step: 6, alter: -1},
      'Eb': {step: 2, alter: -1},
      'Ab': {step: 5, alter: -1},
      'Db': {step: 1, alter: -1},
      'Gb': {step: 4, alter: -1},
      'Cb': {step: 0, alter: -1}, 
      // Minor keys (assume relative Major signature logic for key signature, but tonic for degree mapping?)
      // Wait, if Key is Am. Root is A (5).
      // Scale is Minor (Natural).
      // Intervals: 0, 2, 3, 5, 7, 8, 10
      // Diatonic steps: 0, 1, 2, 3, 4, 5, 6 (1=Le, 2=Ti, 3=Do...) NO.
      // 1=La (A), 2=Ti (B), 3=Do (C)...
      'Am': {step: 5, alter: 0}, 
      'Em': {step: 2, alter: 0},
      'Bm': {step: 6, alter: 0},
      'F#m': {step: 3, alter: 1},
      'C#m': {step: 0, alter: 1},
      'G#m': {step: 4, alter: 1},
      'D#m': {step: 1, alter: 1},
      'A#m': {step: 5, alter: 1},
      'Dm': {step: 1, alter: 0},
      'Gm': {step: 4, alter: 0},
      'Cm': {step: 0, alter: 0},
      'Fm': {step: 3, alter: 0},
      'Bbm': {step: 6, alter: -1},
      'Ebm': {step: 2, alter: -1},
      'Abm': {step: 5, alter: -1}
  };

  const rootInfo = keyRootMap[keySig] || {step: 0, alter: 0};
  const isMinor = keySig.endsWith('m');

  // Scale intervals in semitones
  const scaleSemitones = isMinor 
      ? [0, 2, 3, 5, 7, 8, 10] // Natural Minor
      : [0, 2, 4, 5, 7, 9, 11]; // Major
  
  // Map step index back to name
  const stepNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  song.measures.forEach((m, mIdx) => {
    const xmlMeasure = {
        number: String(mIdx + 1),
        notes: [],
        new_system: mIdx > 0 && mIdx % 4 === 0 
    };
    xmlMeasure.divisions = 4; 

    if (m.elements) {
        m.elements.forEach(el => {
            if (el.type === 'group' && el.group && el.group.notes) {
                el.group.notes.forEach((n, nIdx) => {
                   const degreeIndex = n.degree - 1; 
                   const isRest = n.degree == 0;
                   
                   let step = 'C';
                   let alter = 0;
                   // Default octave to 4. We will calculate the real octave below.
                   let octave = 4;
                   
                   if (!isRest && degreeIndex >= 0 && degreeIndex < 7) {
                       // 1. Calculate Target Diatonic Step
                       // Standard 7-note scale always advances 1 diatonic step per degree
                       const rawStepIndex = rootInfo.step + degreeIndex;
                       const stepIndex = rawStepIndex % 7;
                       // Octave bump from scale wrap-around (e.g. if root=G and note=7, steps up?)
                       // Actually, standard Major/Minor scales wrapped in one octave.
                       // E.g. G Major: G(4), A(5), B(6), C(0+1), D(1+1)...
                       const scaleOctaveBump = Math.floor(rawStepIndex / 7);
                       
                       step = stepNames[stepIndex];
                       
                       // 2. Calculate Expected Pitch (Semitones)
                       // Base pitch of Root (C=0).
                       const rootBaseSemitone = stepToSemitone[rootInfo.step] + rootInfo.alter; 
                       
                       // Target pitch relative to the root's base octave "C"
                       // = RootPitch + ScaleInterval of degree
                       let targetSemitone = rootBaseSemitone + scaleSemitones[degreeIndex];
                       
                       // Apply input accidentals (sharp/flat on the note itself)
                       if (n.accidental === 'sharp') targetSemitone += 1;
                       if (n.accidental === 'flat') targetSemitone -= 1;
                       
                       // 3. Calculate Alter
                       // The targetSemitone might be > 12 (next octave).
                       // We need to compare it to the natural pitch of the resulting step.
                       // Natural pitch of stepIndex in semitones (0-11)
                       const stepNaturalSemitone = stepToSemitone[stepIndex];
                       
                       // The effective octave of the target note relative to the BASE octave
                       // E.g. if scaleOctaveBump is 1, it means we crossed C.
                       // Total semitones relative to C of base octave = targetSemitone.
                       // Natural semitones relative to C of base octave = stepNaturalSemitone + (scaleOctaveBump * 12).
                       
                       const naturalTotalSemitone = stepNaturalSemitone + (scaleOctaveBump * 12);
                       
                       // Alter is the difference
                       let diff = targetSemitone - naturalTotalSemitone;
                       
                       alter = diff;
                       
                       // 4. Calculate Final Octave
                       // Final Octave = BaseOctave + ScaleOctaveBump + UserOctaveShift
                       // Note: UserOctaveShift (n.octaveShift) is the dots on the note (e.g. +1 dot).
                       
                       octave = baseOctave + scaleOctaveBump + (n.octaveShift || 0);
                       
                   } else if (n.degree !== 0) {
                        step = 'C';
                        alter = 0;
                        octave = 4;
                   } else {
                        // Rest
                        step = 'C'; 
                        octave = 4;
                   }

                   // Duration calculation
                   let duration = 4; 
                   let xmlType = 'quarter';

                   switch(n.duration) {
                       case 'whole': duration = 16; xmlType = 'whole'; break;
                       case 'half': duration = 8; xmlType = 'half'; break;
                       case 'quarter': duration = 4; xmlType = 'quarter'; break;
                       case 'eighth': duration = 2; xmlType = 'eighth'; break;
                       case 'sixteenth': duration = 1; xmlType = '16th'; break;
                   }

                   if (n.dotted) {
                       duration = Math.floor(duration * 1.5);
                   }

                   let tie = null;
                   if (n.tieStart) tie = 'start';
                   if (n.tieEnd) tie = 'stop'; 
                   
                   xmlMeasure.notes.push({
                       isRest,
                       step,
                       alter,
                       octave,
                       duration, // divisions value
                       xmlType,  // string name
                       tie,      // start or stop
                       hasDot: n.dotted ? true : false,
                       lyric: nIdx === 0 ? el.group.lyric : null 
                   });
                });
            }
        });
    }
    
    measures.push(xmlMeasure);
  });
  
  return measures;
}

app.post('/api/export/musicxml', (req, res) => {
    try {
        const { title, artist, data } = req.body;
        
        // Data usually is the song object itself if passed directly 
        // or req.body could be the song object. 
        // Let's support both {title, artist, data: song} and just song.
        
        const songData = data || req.body; 
        const songTitle = title || songData.title || "Untitled";
        const songArtist = artist || songData.originalArtist || "";
        const songKey = songData.keySignature || req.body.key_signature || "C"; // Default C if missing

        // Convert key signature string to fifths integer
        // Standard keys: 
        // C=0, G=1, D=2, A=3, E=4, B=5, F#=6, C#=7
        // F=-1, Bb=-2, Eb=-3, Ab=-4, Db=-5, Gb=-6, Cb=-7
        const keyMap = {
            "C": 0, "G": 1, "D": 2, "A": 3, "E": 4, "B": 5, "F#": 6, "C#": 7,
            "F": -1, "Bb": -2, "Eb": -3, "Ab": -4, "Db": -5, "Gb": -6, "Cb": -7,
            "Am": 0, "Em": 1, "Bm": 2, "F#m": 3, "C#m": 4, "G#m": 5, "D#m": 6, "A#m": 7,
            "Dm": -1, "Gm": -2, "Cm": -3, "Fm": -4, "Bbm": -5, "Ebm": -6, "Abm": -7
        };
        const fifths = keyMap[songKey] !== undefined ? keyMap[songKey] : 0;

        const generator = new StandardMusicXMLGenerator(songTitle, songArtist, fifths);
        generator.measures = convertToXmlData(songData);
        
        const xmlContent = generator.generate();

        res.set({
             'Content-Type': 'application/vnd.recordare.musicxml+xml',
             'Content-Disposition': `attachment; filename="${encodeURIComponent(songTitle)}.musicxml"`,
        });
        res.send(xmlContent);

    } catch (err) {
        console.error("Export error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get all songs
app.get('/api/songs', (req, res) => {
  const sql = 'SELECT id, title, artist, key_signature, updated_at FROM songs ORDER BY updated_at DESC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: rows
    });
  });
});

// Get a single song
app.get('/api/songs/:id', (req, res) => {
  const sql = 'SELECT * FROM songs WHERE id = ?';
  const params = [req.params.id];
  db.get(sql, params, (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: row
    });
  });
});

// Create a new song
app.post('/api/songs', (req, res) => {
  const { title, artist, key_signature, data } = req.body;
  const sql = 'INSERT INTO songs (title, artist, key_signature, data) VALUES (?,?,?,?)';
  const params = [title, artist, key_signature, JSON.stringify(data)];
  
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: { id: this.lastID }
    });
  });
});

// Update a song
app.put('/api/songs/:id', (req, res) => {
  const { title, artist, key_signature, data } = req.body;
  const sql = `UPDATE songs SET 
               title = COALESCE(?, title), 
               artist = COALESCE(?, artist), 
               key_signature = COALESCE(?, key_signature), 
               data = COALESCE(?, data),
               updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`;
  const params = [title, artist, key_signature, JSON.stringify(data), req.params.id];

  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      changes: this.changes
    });
  });
});

// Delete a song
app.delete('/api/songs/:id', (req, res) => {
  const sql = 'DELETE FROM songs WHERE id = ?';
  const params = [req.params.id];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'deleted',
      changes: this.changes
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
