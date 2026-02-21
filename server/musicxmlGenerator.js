
class XMLElement {
  constructor(tag, attrs = {}) {
    this.tag = tag;
    this.attrs = attrs;
    this.text = null;
    this.children = [];
  }

  subElement(tag, attrs = {}) {
    const child = new XMLElement(tag, attrs);
    this.children.push(child);
    return child;
  }

  setText(text) {
    this.text = text;
    return this;
  }

  toString(indent = 0) {
    const spaces = '  '.repeat(indent);
    let attrsStr = Object.entries(this.attrs)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');

    const hasChildren = this.children.length > 0;
    const hasText = this.text !== null && this.text !== undefined;

    if (!hasChildren && !hasText) {
      return `${spaces}<${this.tag}${attrsStr} />`;
    }

    let content = '';
    if (hasChildren) {
      if (hasText) {
        content += `\n${'  '.repeat(indent + 1)}${this.escapeXml(String(this.text))}`;
      }
      content += '\n' + this.children.map(c => c.toString(indent + 1)).join('\n');
      content += `\n${spaces}`;
    } else {
      content += this.escapeXml(String(this.text));
    }

    return `${spaces}<${this.tag}${attrsStr}>${content}</${this.tag}>`;
  }

  escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }
}

class StandardMusicXMLGenerator {
  constructor(title = "未命名作品", artist = "", keyFifths = 0) {
    this.title = title;
    this.artist = artist;
    this.keyFifths = keyFifths;
    this.rights = "";
    this.measures = [];
  }

  _txt(parent, name, text) {
    const el = parent.subElement(name);
    el.setText(text);
    return el;
  }

  generate() {
    const root = new XMLElement("score-partwise", { version: "3.1" });

    // ---- identification ----
    const idEl = root.subElement("identification");
    if (this.artist) {
      idEl.subElement("creator", { type: "artist" }).setText(this.artist);
    }

    const enc = idEl.subElement("encoding");
    this._txt(enc, "software", "MuseScore 2.2.1"); // Keeping compatibility signature
    this._txt(enc, "encoding-date", new Date().toISOString().split('T')[0]);

    const supports = [
      { element: "accidental", type: "yes" },
      { element: "beam", type: "yes" },
      { element: "print", attribute: "new-page", value: "yes", type: "yes" },
      { element: "print", attribute: "new-system", value: "yes", type: "yes" },
      { element: "stem", type: "yes" }
    ];

    supports.forEach(s => enc.subElement("supports", s));

    // ---- defaults ----
    const defaults = root.subElement("defaults");
    const scaling = defaults.subElement("scaling");
    this._txt(scaling, "millimeters", "7.05556");
    this._txt(scaling, "tenths", "40");

    const pageLayout = defaults.subElement("page-layout");
    this._txt(pageLayout, "page-height", "1584");
    this._txt(pageLayout, "page-width", "1224");

    ["even", "odd"].forEach(t => {
      const margins = pageLayout.subElement("page-margins", { type: t });
      this._txt(margins, "left-margin", "56.6929");
      this._txt(margins, "right-margin", "56.6929");
      this._txt(margins, "top-margin", "56.6929");
      this._txt(margins, "bottom-margin", "113.386");
    });

    // ---- credits ----
    if (this.artist) {
      const creditAuth = root.subElement("credit", { page: "1" });
      creditAuth.subElement("credit-words", {
        "default-x": "1167.31",
        "default-y": "1402.31",
        "justify": "right",
        "valign": "bottom",
        "font-size": "12"
      }).setText(`原唱：${this.artist}`);
    }

    const creditTitle = root.subElement("credit", { page: "1" });
    creditTitle.subElement("credit-words", {
      "default-x": "612",
      "default-y": "1527.31",
      "justify": "center",
      "valign": "top",
      "font-size": "24"
    }).setText(this.title);

    // ---- part-list ----
    const partList = root.subElement("part-list");
    const scorePart = partList.subElement("score-part", { id: "P1" });
    this._txt(scorePart, "part-name", "Piano");

    // ---- part content ----
    const part = root.subElement("part", { id: "P1" });

    this.measures.forEach((m, i) => {
      const mEl = part.subElement("measure", { number: String(i + 1) });

      const printEl = mEl.subElement("print", m.new_system ? { "new-system": "yes" } : {});

      // Layout headers only on first measure
      if (i === 0) {
        const attr = mEl.subElement("attributes");
        this._txt(attr, "divisions", m.divisions || "2"); // Standard quarters usually divisions=1 or 2

        const key = attr.subElement("key");
        this._txt(key, "fifths", String(this.keyFifths)); // Use dynamic key fifths

        const time = attr.subElement("time");
        this._txt(time, "beats", "4");
        this._txt(time, "beat-type", "4");

        const clef = attr.subElement("clef");
        this._txt(clef, "sign", "G");
        this._txt(clef, "line", "2");

        if (m.bpm) {
          const direction = mEl.subElement("direction", { placement: "above" });
          const dirType = direction.subElement("direction-type");
          const metro = dirType.subElement("metronome", { parentheses: "no" });
          this._txt(metro, "beat-unit", "quarter");
          this._txt(metro, "per-minute", String(m.bpm));
          direction.subElement("sound", { tempo: String(m.bpm) });
        }
      }

      // ---- notes ----
      // Tracks accidentals in the current measure (reset for each measure)
      let currentAlterMap = {}; 

      (m.notes || []).forEach(noteData => {
        const note = mEl.subElement("note");
        // noteKey needs to be defined
        const noteKey = `${noteData.step}${noteData.octave || 4}`;

        // Rest or Pitch
        if (noteData.isRest || noteData.step === '0' || noteData.step === 0) {
          note.subElement("rest");
        } else {
          const pitch = note.subElement("pitch");
          this._txt(pitch, "step", noteData.step);
          
          let alterValue = noteData.alter || 0;
          if (alterValue !== 0) {
            this._txt(pitch, "alter", String(alterValue));
          }
          this._txt(pitch, "octave", String(noteData.octave || 4));

          // If not in map yet, initialize it with key signature
          if (currentAlterMap[noteKey] === undefined) {
             let keyAlter = 0;
             // Calculate key signature effect
             if (this.keyFifths > 0) {
                 const sharpNotes = "FCGDAEB".substring(0, this.keyFifths).split('');
                 if (sharpNotes.includes(noteData.step)) keyAlter = 1;
             } else if (this.keyFifths < 0) {
                 const flatNotes = "BEADGCF".substring(0, Math.abs(this.keyFifths)).split('');
                 if (flatNotes.includes(noteData.step)) keyAlter = -1;
             }
             currentAlterMap[noteKey] = keyAlter;
          }

          let expectedAlter = currentAlterMap[noteKey];
          let accValue = null;

          if (alterValue !== expectedAlter) {
             if (alterValue === 0) accValue = "natural";
             else if (alterValue === 1) accValue = "sharp";
             else if (alterValue === -1) accValue = "flat";
             
             // Update the map for subsequent notes in this measure
             currentAlterMap[noteKey] = alterValue;
             
             this._txt(note, "accidental", accValue);
          }
        }

        this._txt(note, "duration", String(noteData.duration || 2));

        if (noteData.tie === 'stop' || noteData.tie === 'both') {
          note.subElement("tie", { type: "stop" });
        }
        if (noteData.tie === 'start' || noteData.tie === 'both') {
          note.subElement("tie", { type: "start" });
        }

        this._txt(note, "voice", "1");
        this._txt(note, "type", noteData.xmlType || "quarter");

        if (noteData.hasDot) {
          note.subElement("dot");
        }

        this._txt(note, "stem", noteData.stem || "up");

        if (noteData.tie) {
          const notations = note.subElement("notations");
          if (noteData.tie === 'stop' || noteData.tie === 'both') {
            notations.subElement("tied", { type: "stop" });
          }
          if (noteData.tie === 'start' || noteData.tie === 'both') {
            notations.subElement("tied", { type: "start" });
          }
        }

        // Lyric
        if (noteData.lyric) {
          const lyric = note.subElement("lyric", { number: "1" });
          this._txt(lyric, "syllabic", "single");
          this._txt(lyric, "text", noteData.lyric);
        }
      });
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
${root.toString(0)}`;
  }
}

module.exports = StandardMusicXMLGenerator;
