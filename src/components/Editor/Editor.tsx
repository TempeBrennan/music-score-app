import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Score from "../Score";
import type { ScoreHandle } from "../Score";
import NoteToolbar from "../NoteToolbar";
import { useQuickInput } from "../../hooks/useQuickInput";
import { useSongData } from "../../hooks/useSongData";
import { useSongPersistence } from "../../hooks/useSongPersistence";
import { useSongOperations } from "../../hooks/useSongOperations";
import { Song, Accidental, Duration as DurationEnum, Degree } from "../../types";
import "./Editor.css";

// Declare global to extend Window interface
declare global {
  interface Window {
    MusicNotation: {
      getData: () => Song;
      setData: (data: Song) => void;
      exportJSON: () => string;
      exportMusicXML?: () => void;
      importJSON: (jsonString: string) => void;
    };
  }
}

// 简单示例 Song（用于初始展示）
const demoSong: Song = {
  title: "新乐谱",
  originalArtist: "未知",
  measures: [
    {
      elements: [
        {
          type: "group",
          group: {
            notes: [
              { degree: Degree.C, accidental: Accidental.Natural, duration: DurationEnum.Quarter },
              { degree: Degree.C, accidental: Accidental.Natural, duration: DurationEnum.Quarter },
              { degree: Degree.G, accidental: Accidental.Natural, duration: DurationEnum.Quarter },
              { degree: Degree.G, accidental: Accidental.Natural, duration: DurationEnum.Quarter },
            ],
            lyric: "一闪一闪",
          },
        },
      ],
    },
  ],
};

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 使用 Persistence Hook 管理 Song 状态和加载/保存
  const { song, setSong, saveSong: saveSongToBackend, loading, error } = useSongPersistence(id, demoSong);
  
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const scoreRef = useRef<ScoreHandle | null>(null);
  
  const [quickInputConfig, setQuickInputConfig] = useState({
    pitch: 1,
    duration: 4 as 1 | 2 | 4 | 8 | 16,
    octaveShift: 0,
    dotted: false,
    alter: 0,
  });

  // 使用 Operations Hook 管理 Song 编辑操作
  const { getNoteById, updateNote, deleteNote, addMeasure, appendNote } = useSongOperations(song, setSong, selectedNoteId, setSelectedNoteId);

  // 处理保存按钮点击
  const handleSave = async () => {
    const result = await saveSongToBackend();
    if (result.success) {
      alert('保存成功');
      if (result.id && (!id || id === 'new')) {
         navigate(`/editor/${result.id}`);
      }
    } else {
      alert('保存失败: ' + result.error);
    }
  };

  const quickInput = useQuickInput({ 
    song, 
    onSongChange: setSong, 
    config: quickInputConfig, 
    selectedNoteId,
    onSelectNote: setSelectedNoteId,
    onDeleteNote: deleteNote,
  });
  
  const { exportSongJSON, copySongToClipboard, importSongFromClipboard, handleExportMusicXML, importSongFromFile } = useSongData(song, setSong);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 暴露数据操作方法到全局（基于 Song）
  useEffect(() => {
    window.MusicNotation = {
      getData: () => {
        const data = scoreRef.current?.exportData();
        return data ?? song;
      },
      setData: (data: Song) => {
        setSong(data);
      },
      exportJSON: () => {
        if (exportSongJSON) {
           exportSongJSON();
        }
        return JSON.stringify(song, null, 2);
      },
      exportMusicXML: () => {
         handleExportMusicXML();
      },
      importJSON: (jsonString: string) => {
        try {
          const data = JSON.parse(jsonString) as Song;
          setSong(data);
        } catch (error) {
          console.error("导入失败:", error);
          throw error;
        }
      },
    };
  }, [song, exportSongJSON, setSong]);

  const selectedNoteObj = selectedNoteId ? getNoteById(selectedNoteId) : null;
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div className="app">
      <div className="app-content">
        <div className="left-panel">
          <div className="nav-toolbar">
              <button onClick={() => navigate('/')} className="back-btn">← 返回首页</button>
          </div>
          <NoteToolbar 
            onQuickInputConfigChange={setQuickInputConfig}
            selectedNote={selectedNoteObj ? selectedNoteObj.note : null}
            onUpdateSelectedNote={updateNote}
            onAppendNote={appendNote}
            onDeleteNote={deleteNote}
          />
        </div>
        <div className="score-container">
          <div className="score-toolbar">
            <div className="toolbar-group">
              <input 
                type="text" 
                className="song-input title-input"
                value={song.title} 
                onChange={(e) => setSong({...song, title: e.target.value})}
                placeholder="歌曲名"
                title="编辑歌曲名"
              />
              <input 
                type="text" 
                className="song-input artist-input"
                value={song.originalArtist || ''} 
                onChange={(e) => setSong({...song, originalArtist: e.target.value})}
                placeholder="演唱者"
                title="编辑演唱者"
              />
              <select
                className="song-input key-select"
                value={song.keySignature || 'C'}
                onChange={(e) => setSong({...song, keySignature: e.target.value})}
                title="选择调号"
              >
                <optgroup label="大调 (Major)">
                  <option value="C">C 大调</option>
                  <option value="G">G 大调 (1#)</option>
                  <option value="D">D 大调 (2#)</option>
                  <option value="A">A 大调 (3#)</option>
                  <option value="E">E 大调 (4#)</option>
                  <option value="B">B 大调 (5#)</option>
                  <option value="F#">F# 大调 (6#)</option>
                  <option value="C#">C# 大调 (7#)</option>
                  <option value="F">F 大调 (1b)</option>
                  <option value="Bb">Bb 大调 (2b)</option>
                  <option value="Eb">Eb 大调 (3b)</option>
                  <option value="Ab">Ab 大调 (4b)</option>
                  <option value="Db">Db 大调 (5b)</option>
                  <option value="Gb">Gb 大调 (6b)</option>
                  <option value="Cb">Cb 大调 (7b)</option>
                </optgroup>
                <optgroup label="小调 (Minor)">
                  <option value="Am">a 小调</option>
                  <option value="Em">e 小调 (1#)</option>
                  <option value="Bm">b 小调 (2#)</option>
                  <option value="F#m">f# 小调 (3#)</option>
                  <option value="C#m">c# 小调 (4#)</option>
                  <option value="G#m">g# 小调 (5#)</option>
                  <option value="D#m">d# 小调 (6#)</option>
                  <option value="A#m">a# 小调 (7#)</option>
                  <option value="Dm">d 小调 (1b)</option>
                  <option value="Gm">g 小调 (2b)</option>
                  <option value="Cm">c 小调 (3b)</option>
                  <option value="Fm">f 小调 (4b)</option>
                  <option value="Bbm">bb 小调 (5b)</option>
                  <option value="Ebm">eb 小调 (6b)</option>
                  <option value="Abm">ab 小调 (7b)</option>
                </optgroup>
              </select>
              <select
                className="song-input octave-select"
                value={song.baseOctave !== undefined ? song.baseOctave : 4}
                onChange={(e) => setSong({...song, baseOctave: parseInt(e.target.value)})}
                title="选择基准八度 (1 = ?)"
                style={{ width: '80px', marginLeft: '8px' }}
              >
                  <option value="2">Low (2)</option>
                  <option value="3">Mid-Low (3)</option>
                  <option value="4">Mid (4)</option>
                  <option value="5">High (5)</option>
                  <option value="6">Very High (6)</option>
              </select>
            </div>
            <div className="toolbar-divider"></div>
            <button 
              className={`quick-input-toggle ${quickInput.isActive ? 'active' : ''}`}
              onClick={quickInput.toggle}
            >
              ⚡ {quickInput.isActive ? '退出' : '开启'}快速录入
            </button>
            <button 
              className="add-measure-btn"
              onClick={addMeasure}
            >
              ➕ 新增小节
            </button>
            <div className="toolbar-divider"></div>
            <button className="save-btn" onClick={handleSave}>💾 保存乐谱</button>
            <div className="toolbar-divider"></div>
            <button className="export-btn" onClick={handleExportMusicXML}>🎼 导出XML</button>
            <button className="export-json-btn" onClick={exportSongJSON} style={{marginLeft: '8px', padding: '0 12px', height: '32px', cursor: 'pointer'}}>🛠️ 导出JSON</button>
            <button className="import-json-btn" onClick={() => fileInputRef.current?.click()} style={{marginLeft: '8px', padding: '0 12px', height: '32px', cursor: 'pointer'}}>📂 导入JSON</button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  importSongFromFile(file);
                  // Reset input value to allow selecting same file again
                  e.target.value = '';
                }
              }}
            />
          </div>
          
          {quickInput.isActive && (
            <div className="quick-input-hints-bar">
              <span className="hint-title">⚡ 快速录入模式：</span>
              <span className="hint-item"><kbd>0-7</kbd> 输入音符(0为休止符)</span>
              <span className="hint-item"><kbd>Shift+↑/↓</kbd> 移动八度</span>
              <span className="hint-item"><kbd>Q/W</kbd> 减小/增大时值</span>
              <span className="hint-item"><kbd>.</kbd> 附点</span>
              <span className="hint-item"><kbd># / b / n</kbd> 升/降/还原</span>
              <span className="hint-item"><kbd>Enter</kbd> 换行/确定</span>
              <span className="hint-item"><kbd>Backspace</kbd> 删除</span>
              <span className="hint-item"><kbd>Esc</kbd> 退出/取消选中</span>
            </div>
          )}

          <Score 
            song={song} 
            onSongChange={setSong}
            selectedNoteId={selectedNoteId} 
            onNoteSelect={(id) => setSelectedNoteId(id)} 
            ref={scoreRef} 
          />
        </div>
      </div>
    </div>
  );
}

export default Editor;
