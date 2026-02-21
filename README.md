# React Music Notation (简谱编辑器)

一个基于 React + TypeScript + Vite 构建的简谱编辑器组件库。

## 功能特性

- ✅ 完整的简谱显示（音高、时值、八度、附点、连音线、歌词）
- ✅ A4 纸张大小的页面布局
- ✅ 层次化的数据结构（Score → Page → Row → Bar → Note）
- ✅ 可视化编辑：点击音符弹出编辑框
- ✅ TypeScript 类型安全
- ✅ 响应式设计

## 数据结构

```typescript
Note：音符（音高、时值、八度、附点等）
Bar：小节（包含多个音符）
Row：行（包含多个小节）
Page：页（包含多个行）
Score：曲谱（包含多个页）
```

## 开始使用

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
├── components/          # 组件文件夹
│   ├── Note.tsx        # 音符组件
│   ├── NoteEditor.tsx  # 音符编辑器
│   ├── Bar.tsx         # 小节组件
│   ├── Row.tsx         # 行组件
│   ├── Page.tsx        # 页组件
│   ├── Score.tsx       # 曲谱组件
│   └── DataToolbar.tsx # 数据工具栏
├── styles/             # 样式文件夹
│   ├── global.css      # 全局样式
│   ├── Note.css        # 音符样式
│   ├── NoteEditor.css  # 编辑器样式
│   ├── Bar.css         # 小节样式
│   ├── Row.css         # 行样式
│   ├── Page.css        # 页样式
│   ├── Score.css       # 曲谱样式
│   └── DataToolbar.css # 工具栏样式
├── types.ts            # 类型定义
├── exampleData.ts      # 示例数据
├── App.tsx             # 主应用
└── main.tsx            # 入口文件
```

## 使用示例

### 基本用法

```tsx
import { Score } from './components/Score';
import { Score as IScore } from './types';

const myScore: IScore = {
  title: "我的曲谱",
  pages: [{
    rows: [{
      bars: [{
        notes: [
          { pitch: 1, duration: 4 },
          { pitch: 2, duration: 8, octaveShift: 1 },
          { pitch: 3, duration: 4, dotted: true }
        ]
      }]
    }]
  }]
};

function App() {
  return <Score score={myScore} onScoreChange={setScore} />;
}
```

### 全局 API 使用

在浏览器控制台中使用以下方法：

```javascript
// 获取当前曲谱数据
const data = window.MusicNotation.getData();

// 设置曲谱数据
window.MusicNotation.setData(newScoreData);

// 导出为 JSON 字符串
const json = window.MusicNotation.exportJSON();

// 从 JSON 字符串导入
window.MusicNotation.importJSON(jsonString);

// 使用内置示例
window.MusicNotation.setData(window.MusicNotation.examples.simple);
window.MusicNotation.setData(window.MusicNotation.examples.medium);
window.MusicNotation.setData(window.MusicNotation.examples.complex);
window.MusicNotation.setData(window.MusicNotation.examples.multiPage);
```

### 数据格式示例

```json
{
  "title": "小星星",
  "timeSignature": "1=C 4/4",
  "key": "C大调",
  "pages": [
    {
      "rows": [
        {
          "bars": [
            {
              "notes": [
                { "pitch": 1, "duration": 4 },
                { "pitch": 1, "duration": 4 },
                { "pitch": 5, "duration": 4 },
                { "pitch": 5, "duration": 4 }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## 音符属性说明

- **pitch**: 音高 (0-7)，0 表示休止符
- **duration**: 时值 (1=全音符, 2=二分, 4=四分, 8=八分, 16=十六分)
- **octaveShift**: 八度偏移 (正数升高，负数降低)
- **dotted**: 是否为附点音符
- **tieToNext**: 是否有连音线连接到下一个音符
- **lyric**: 歌词文本

## 界面功能

### 数据工具栏
- 📥 导出 JSON：下载曲谱数据为 JSON 文件
- 📋 复制数据：复制曲谱数据到剪贴板
- 📄 粘贴数据：从剪贴板导入曲谱数据
- 📂 从文件导入：从本地 JSON 文件导入数据

### 音符编辑
- 点击任意音符打开编辑框
- 可修改音高、时值、八度、附点、连音线、歌词
- 实时预览编辑效果

## 技术栈

- React 18
- TypeScript 5
- Vite 5
- CSS3

## 开发计划

- [ ] 添加音符删除功能
- [ ] 添加小节增删功能
- [ ] 支持更多音乐符号（反复记号、力度记号等）
- [ ] 支持 MIDI 播放
- [ ] 支持导出为图片/PDF

## License

MIT
