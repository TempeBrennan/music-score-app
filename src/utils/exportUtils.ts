
export const exportMusicXML = async (song: any) => {
    try {
        // Send format matching what server expects
        const response = await fetch('http://localhost:3001/api/export/musicxml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: song.title,
                artist: song.originalArtist,
                data: song // or just spread song if server handles it
            })
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${song.title || 'score'}.musicxml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("MusicXML Export Error", error);
        alert("导出 MusicXML 失败");
    }
};
