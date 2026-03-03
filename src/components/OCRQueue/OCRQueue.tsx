import { useState, useCallback, useEffect, useRef } from 'react';
import { Measure } from '../../types';
import { convertOCRToMeasure } from '../../utils/ocrUtils';
import './OCRQueue.css';

interface OCRTask {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  measure?: Measure;
  errorMsg?: string;
}

interface Props {
  onMeasuresReady: (measures: Measure[]) => void;
  onClose: () => void;
}

export default function OCRQueue({ onMeasuresReady, onClose }: Props) {
  const [tasks, setTasks] = useState<OCRTask[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  // Global paste → add images to queue
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const f = items[i].getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) {
        e.preventDefault();
        addFilesToQueue(files);
      }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, []);

  const addFilesToQueue = useCallback((files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    setTasks(prev => [
      ...prev,
      ...imageFiles.map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending' as const,
      })),
    ]);
  }, []);

  // Process tasks one by one (sequential)
  useEffect(() => {
    if (processingRef.current) return;
    const pendingTask = tasks.find(t => t.status === 'pending');
    if (!pendingTask) return;

    processingRef.current = true;
    setTasks(prev => prev.map(t => t.id === pendingTask.id ? { ...t, status: 'processing' } : t));

    const formData = new FormData();
    formData.append('image', pendingTask.file);

    fetch('http://localhost:3001/api/ocr-measure', { method: 'POST', body: formData })
      .then(r => r.json())
      .then(result => {
        if (result.success && result.data) {
          const measure = convertOCRToMeasure(result.data);
          setTasks(prev => prev.map(t => t.id === pendingTask.id
            ? { ...t, status: measure ? 'done' : 'error', measure: measure ?? undefined, errorMsg: measure ? undefined : '解析数据转换失败' }
            : t
          ));
        } else {
          setTasks(prev => prev.map(t => t.id === pendingTask.id
            ? { ...t, status: 'error', errorMsg: result.message || '识别失败' }
            : t
          ));
        }
      })
      .catch(err => {
        setTasks(prev => prev.map(t => t.id === pendingTask.id
          ? { ...t, status: 'error', errorMsg: err.message }
          : t
        ));
      })
      .finally(() => {
        processingRef.current = false;
      });
  }, [tasks]);

  const allSettled = tasks.length > 0 && tasks.every(t => t.status === 'done' || t.status === 'error');
  const doneTasks = tasks.filter(t => t.status === 'done' && t.measure);
  const processingCount = tasks.filter(t => t.status === 'processing').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  const handleApply = useCallback(() => {
    onMeasuresReady(doneTasks.map(t => t.measure!));
    tasks.forEach(t => URL.revokeObjectURL(t.previewUrl));
    setTasks([]);
  }, [doneTasks, tasks, onMeasuresReady]);

  const handleRemove = useCallback((id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task) URL.revokeObjectURL(task.previewUrl);
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    tasks.forEach(t => URL.revokeObjectURL(t.previewUrl));
    setTasks([]);
  }, [tasks]);

  return (
    <div className="ocr-panel">
      <div className="ocr-panel-header">
        <span className="ocr-panel-title">📷 图片识别小节</span>
        <span className="ocr-panel-hint">Ctrl+V 粘贴 · 拖拽 · 点击选图，支持批量</span>
        <button className="ocr-panel-close" onClick={onClose} title="关闭">✕</button>
      </div>

      {/* Drop Zone */}
      <div
        className={`ocr-drop-zone${isDragOver ? ' drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={e => { e.preventDefault(); setIsDragOver(false); addFilesToQueue(Array.from(e.dataTransfer.files)); }}
        onClick={() => fileInputRef.current?.click()}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <div className="ocr-drop-icon">{isDragOver ? '📥' : '🖼️'}</div>
        <p className="ocr-drop-title">
          {isDragOver ? '松开鼠标添加图片' : '点击选图 / 拖拽图片 / Ctrl+V 粘贴截图'}
        </p>
        <p className="ocr-drop-sub">每张图片识别为一个新小节，可一次添加多张</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => { addFilesToQueue(Array.from(e.target.files ?? [])); e.target.value = ''; }}
        />
      </div>

      {/* Queue */}
      {tasks.length > 0 && (
        <div className="ocr-queue">
          <div className="ocr-queue-header">
            <span className="ocr-queue-title">
              识别队列
              <span className="ocr-queue-stats">
                {doneTasks.length}/{tasks.length} 完成
                {(processingCount + pendingCount) > 0 && ` · ${processingCount + pendingCount} 进行中`}
              </span>
            </span>
            <button className="ocr-clear-btn" onClick={handleClearAll}>🗑 清空</button>
          </div>

          <div className="ocr-task-list">
            {tasks.map((task, idx) => (
              <div key={task.id} className={`ocr-task-item ocr-task-${task.status}`}>
                <img src={task.previewUrl} className="ocr-task-thumb" alt={`图片 ${idx + 1}`} />
                <div className="ocr-task-info">
                  <span className="ocr-task-num">#{idx + 1}</span>
                  <span className="ocr-task-name" title={task.file.name}>{task.file.name || `图片 ${idx + 1}`}</span>
                </div>
                <div className="ocr-task-status">
                  {task.status === 'pending' && <span className="status-tag status-pending">⏳ 等待</span>}
                  {task.status === 'processing' && <span className="status-tag status-processing"><span className="ocr-spin">↻</span> 识别中</span>}
                  {task.status === 'done' && <span className="status-tag status-done">✅ 完成</span>}
                  {task.status === 'error' && <span className="status-tag status-error" title={task.errorMsg}>❌ {task.errorMsg}</span>}
                </div>
                {(task.status === 'pending' || task.status === 'error') && (
                  <button className="ocr-task-remove" onClick={() => handleRemove(task.id)} title="移除">✕</button>
                )}
              </div>
            ))}
          </div>

          {allSettled && (
            <div className="ocr-queue-actions">
              {doneTasks.length > 0 && (
                <button className="ocr-apply-btn" onClick={handleApply}>
                  ➕ 追加 {doneTasks.length} 个小节到乐谱
                </button>
              )}
              {doneTasks.length === 0 && (
                <span className="ocr-all-failed">所有图片识别失败，请检查图片内容</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
