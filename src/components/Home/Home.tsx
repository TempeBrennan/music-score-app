import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>我的乐谱库</h1>
        <button className="new-song-btn" onClick={() => navigate('/editor/new')}>
          + 新建乐谱
        </button>
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
