import { useEffect, useCallback, useState } from 'react';
import type { Song, NoteV2 } from '../types';
import { Accidental, Duration as DurationEnum, Degree } from '../types';

interface QuickInputConfig {
  pitch: number;
  duration: 1 | 2 | 4 | 8 | 16;
  octaveShift?: number;
  dotted: boolean;
  alter: number;
}

interface UseQuickInputProps {
  song: Song;
  onSongChange: (song: Song) => void;
  config: QuickInputConfig;
  selectedNoteId?: string | null;
  onSelectNote?: (noteId: string) => void;
  onDeleteNote?: () => void;
}

export const useQuickInput = ({ song, onSongChange, config, selectedNoteId, onSelectNote, onDeleteNote }: UseQuickInputProps) => {
  const [isActive, setIsActive] = useState(false);

  // 解析选中的音符 ID，获取其所在的小节索引
  const getTargetMeasureIdx = useCallback(() => {
    if (selectedNoteId) {
      const match = selectedNoteId.match(/^measure-(\d+)(?:-group-(\d+)-note-(\d+))?$/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    // 如果没有选中的音符，返回最后一个小节的索引
    return song.measures.length > 0 ? song.measures.length - 1 : -1;
  }, [selectedNoteId, song.measures.length]);

  const insertNote = useCallback((pitch: number) => {
    const newSong = JSON.parse(JSON.stringify(song)) as Song;
    let measureIdx = getTargetMeasureIdx();

    // Check if measureIdx is valid for the current song
    if (measureIdx >= newSong.measures.length) {
      measureIdx = newSong.measures.length > 0 ? newSong.measures.length - 1 : -1;
    }

    // 如果没有小节，创建一个
    if (measureIdx === -1) {
      newSong.measures.push({ elements: [{ type: 'group', group: { notes: [], lyric: '歌词' } }] });
      measureIdx = 0;
    }

    const measure = newSong.measures[measureIdx];

    if (!measure) return;

    // 确保小节有至少一个 group
    if (!measure.elements || measure.elements.length === 0) {
      measure.elements = [{ type: 'group', group: { notes: [] } }];
    }

    // 找到最后一个 group，或者创建一个
    let lastGroupIdx = -1;
    for (let i = measure.elements.length - 1; i >= 0; i--) {
      if (measure.elements[i].type === 'group') {
        lastGroupIdx = i;
        break;
      }
    }

    // If no group, create one
    if (lastGroupIdx === -1) {
      measure.elements.push({ type: 'group', group: { notes: [], lyric: '歌词' } });
      lastGroupIdx = measure.elements.length - 1;
    }

    const group = (measure.elements[lastGroupIdx] as any).group;

    const degree = (pitch as unknown) as Degree;
    const accidental = pitch === 0 ? undefined : config.alter === 1 ? Accidental.Sharp : config.alter === -1 ? Accidental.Flat : Accidental.Natural;
    const durationMap: Record<number, DurationEnum> = {
      1: DurationEnum.Whole,
      2: DurationEnum.Half,
      4: DurationEnum.Quarter,
      8: DurationEnum.Eighth,
      16: DurationEnum.Sixteenth,
    };

    const nv: NoteV2 = {
      degree,
      accidental,
      duration: durationMap[config.duration] || DurationEnum.Quarter,
      dotted: config.dotted || undefined,
      octaveShift: config.octaveShift !== 0 ? config.octaveShift : undefined,
    };

    group.notes.push(nv);
    onSongChange(newSong);

    // Automatically select the newly inserted note so subsequent inputs go to the right place
    if (onSelectNote) {
      // Index is measureIdx, elementIdx (lastGroupIdx), noteIdx (last one)
      const newNoteIdx = group.notes.length - 1; 
      // It was pushed above, so length-1 IS the new index.
      const newNoteId = `measure-${measureIdx}-group-${lastGroupIdx}-note-${newNoteIdx}`;
      onSelectNote(newNoteId);
    }
  }, [song, onSongChange, config, getTargetMeasureIdx, onSelectNote]);

  const goToNextMeasure = useCallback(() => {
    const newSong = JSON.parse(JSON.stringify(song)) as Song;
    const currentIdx = getTargetMeasureIdx();

    // 如果当前还有后续小节，移动到下一个
    if (currentIdx < newSong.measures.length - 1) {
      // Tab 键切换到下一个小节的逻辑由于我们现在基于 selectedNoteId，只需要创建新小节
      // 不再需要跟踪 currentMeasurePath
    } else {
      // 创建新小节
      newSong.measures.push({ elements: [{ type: 'group', group: { notes: [], lyric: '歌词' } }] });
      onSongChange(newSong);
    }
  }, [song, onSongChange, getTargetMeasureIdx]);

  const insertNewMeasure = useCallback(() => {
    const newSong = JSON.parse(JSON.stringify(song)) as Song;
    const currentIdx = getTargetMeasureIdx();
    
    // Create new measure with an empty group (waiting for input)
    const newMeasure = {
      elements: [{ 
        type: 'group', 
        group: { 
          notes: [], 
          lyric: '歌词' 
        } 
      }] 
    };
    
    // Insert after current measure
    const insertAtIndex = currentIdx === -1 ? newSong.measures.length : currentIdx + 1;
    newSong.measures.splice(insertAtIndex, 0, newMeasure as any);
    
    onSongChange(newSong);

    if (onSelectNote) {
      // Select the measure itself (convention: measure-X)
      // This allows insertNote to detect the correct measure index
      const newMeasureId = `measure-${insertAtIndex}`;
      onSelectNote(newMeasureId);
    }
  }, [song, onSongChange, getTargetMeasureIdx, onSelectNote]);

  const deactivate = useCallback(() => {
    // Check if the last measure is empty and remove it if so
    if (song.measures.length > 0) {
      const lastMeasure = song.measures[song.measures.length - 1];
      const isEmpty = lastMeasure.elements.every(el => 
        el.type !== 'group' || el.group.notes.length === 0
      );
      
      if (isEmpty) {
        const newSong = JSON.parse(JSON.stringify(song)) as Song;
        newSong.measures.pop();
        onSongChange(newSong);
      }
    }

    setIsActive(false);
  }, [song, onSongChange]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;

    const key = event.key;

    // Tab: 下一个小节 (保留但不作为主要新增方式)
    if (key === 'Tab') {
      event.preventDefault();
      goToNextMeasure();
      return;
    }

    // Enter: 插入新小节并跳转
    if (key === 'Enter') {
      event.preventDefault();
      insertNewMeasure();
      return;
    }

    // Escape: 退出快速输入
    if (key === 'Escape') {
      event.preventDefault();
      deactivate();
      return;
    }

    // Backspace: 删除选中的音符
    if (key === 'Backspace') {
      if (onDeleteNote) {
        event.preventDefault();
        onDeleteNote();
      }
      return;
    }

    // 数字键 0-7: 插入音符
    if (key >= '0' && key <= '7') {
      event.preventDefault();
      const pitch = parseInt(key);
      insertNote(pitch);
      return;
    }
  }, [isActive, insertNote, goToNextMeasure, deactivate, onDeleteNote, insertNewMeasure]);

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isActive, handleKeyDown]);

  const activate = useCallback(() => {
    setIsActive(true);
  }, []);

  const toggle = useCallback(() => {
    if (isActive) {
      deactivate();
    } else {
      activate();
    }
  }, [isActive, activate, deactivate]);

  return {
    isActive,
    activate,
    deactivate,
    toggle,
  };
};
