import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeSongData } from "../../utils/songUtils";
import { Song } from "../../types";
import "./Home.css";

interface SongSummary {
  id: number;
  title: string;
  artist: string;
  key_signature: string;
  updated_at: string;
}

function Home() {
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = () => {
    fetch('http://localhost:3001/api/songs')
      .then(res => res.json())
      .then(res => {
        if (res.message === 'success') {
          setSongs(res.data);
        }
      })
      .catch(err => console.error("Error fetching songs:", err));
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这首歌曲吗？')) {
      fetch(`http://localhost:3001/api/songs/${id}`, { method: 'DELETE' })
        .then(() => fetchSongs())
        .catch(err => console.error("Error deleting song:", err));
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rawData = JSON.parse(text);
        const songData: Song = normalizeSongData(rawData);
        
        // Ensure minimal required fields
        if (!songData.title) songData.title = file.name.replace('.json', '');
        
        // Save as new song
        const response = await fetch('http://localhost:3001/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: songData.title,
            artist: songData.originalArtist,
            key_signature: songData.keySignature || 'C',
            data: songData
          })
        });

        const res = await response.json();
        if (res.message === 'success' && res.data?.id) {
           navigate(`/editor/${res.data.id}`);
        } else {
           alert('保存导入的歌曲失败: ' + (res.error || 'Unknown error'));
        }
      } catch (err) {
        console.error("Import failed:", err);
        alert("导入文件失败，请检查格式");
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>我的乐谱库</h1>
        <div className="header-actions">
            <button className="import-song-btn" onClick={() => fileInputRef.current?.click()} style={{marginRight: '10px'}}>
              📂 导入乐谱
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={handleImportFile}
            />
            <button className="new-song-btn" onClick={() => navigate('/editor/new')}>
              + 新建乐谱
            </button>
        </div>
      </header>
      
      <div className="song-grid">
        {songs.map(song => (
          <div key={song.id} className="song-card" onClick={() => navigate(`/editor/${song.id}`)}>
            <div className="song-info">
              <h3>{song.title || '无标题'}</h3>
              <p className="artist">{song.artist || '未知艺术家'}</p>
              <p className="updated">最后更新: {new Date(song.updated_at).toLocaleDateString()}</p>
            </div>
            <div className="card-actions">
               <button className="edit-btn" onClick={(e) => { e.stopPropagation(); navigate(`/editor/${song.id}`); }}>
                 ✏️ 编辑
               </button>
               <button className="delete-btn" onClick={(e) => handleDelete(e, song.id)}>
                 🗑️ 删除
               </button>
            </div>
          </div>
        ))}
        
        {songs.length === 0 && (
          <div className="empty-state">
            <p>还没有乐谱，点击右上角新建一个吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
