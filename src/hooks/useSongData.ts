import { useCallback } from 'react';
import { Song } from '../types';
import { exportMusicXML } from '../utils/exportUtils';

export function useSongData(song: Song, onImport?: (song: Song) => void) {
  // 导出 MusicXML
  const handleExportMusicXML = useCallback(() => {
     exportMusicXML(song);
  }, [song]);

  // 导出数据为 JSON 文件
  const exportSongJSON = useCallback(() => {
    try {
      const dataStr = JSON.stringify(song, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${song.title || "曲谱"}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('导出成功');
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败');
    }
  }, [song]);

  // 复制数据到剪贴板
  const copySongToClipboard = useCallback(async () => {
    try {
      const dataStr = JSON.stringify(song, null, 2);
      await navigator.clipboard.writeText(dataStr);
      alert("数据已复制到剪贴板！");
    } catch (err) {
      console.error("复制失败:", err);
      alert("复制失败，请手动复制");
    }
  }, [song]);

  // 从剪贴板导入数据
  const importSongFromClipboard = useCallback(async () => {
    if (!onImport) {
        console.warn('onImport callback not provided');
        return;
    }
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text) as Song;
      onImport(data);
      alert("数据导入成功！");
    } catch (err) {
      console.error("导入失败:", err);
      alert("导入失败，请检查数据格式");
    }
  }, [onImport]);

  // 导入文件 (返回一个处理 input change 事件的函数，或者直接处理文件对象)
  const importSongFromFile = useCallback((file: File) => {
    if (!onImport) {
        console.warn('onImport callback not provided');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as Song;
        onImport(data);
        alert("文件导入成功！");
      } catch (err) {
        console.error("导入失败:", err);
        alert("导入失败，请检查文件格式");
      }
    };
    reader.readAsText(file);
  }, [onImport]);

  return {
    exportSongJSON,
    copySongToClipboard,
    importSongFromClipboard,
    importSongFromFile,
    handleExportMusicXML
  };
}
