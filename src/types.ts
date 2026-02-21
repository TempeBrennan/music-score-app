// 新的数据结构定义（v2）——按需求重构
// - 整首歌曲包含：歌曲名、原唱、调号、小节集合
// - 小节由元素数组组成，元素可为分组（group）或空白分隔符（spacer）
// - 分组包含多个音符和一句歌词
// - 音符具有音级(度数+升降号)、时值枚举、附点、延音起/止标记

// 音高度数枚举（包含暂停符 0）
// 使用字母名称并将其映射为数字值，方便在 UI/序列化中使用数字表示
export enum Degree {
  Pause = 0,
  C = 1,
  D = 2,
  E = 3,
  F = 4,
  G = 5,
  A = 6,
  B = 7,
}

// 升降号/还原号枚举
export enum Accidental {
  Natural = "natural", // ♮
  Sharp = "sharp",     // ♯
  Flat = "flat",       // ♭
}

// 时值枚举（使用描述性名称）
export enum Duration {
  Whole = "whole",       // 全音符 (semibreve)
  Half = "half",         // 二分音符 (minim)
  Quarter = "quarter",   // 四分音符 (crotchet)
  Eighth = "eighth",     // 八分音符 (quaver)
  Sixteenth = "sixteenth", // 十六分音符 (semiquaver)
}

// 单个音符
export type NoteV2 = {
  // 度数: 使用 Degree 枚举，支持 Pause=0
  degree: Degree;

  // 升降号，若未指定可认为使用谱号/调号的默认（或使用 Accidental.Natural 表示显式还原）
  accidental?: Accidental;

  // 时值
  duration: Duration;

  // 是否附点
  dotted?: boolean;

  // 八度偏移（可选）：与旧格式兼容的可选字段
  octaveShift?: number;

  // 是否为延音（连音）起始点
  tieStart?: boolean;

  // 是否为延音（连音）终止点
  tieEnd?: boolean;
};

// 分组：一组音符和一句歌词（歌词为可选字符串）
export type Group = {
  notes: NoteV2[];
  lyric?: string; // 一句歌词（可包含多个字/词），此句对应该组内音符的顺序
};

// 空白分隔符：仅用于视觉分隔小节中的不同分组
export type Spacer = {
  type: "spacer";
  // 可选：width/visualHint 等未来扩展字段
  width?: number;
};

// 小节元素：分组或空白分隔
export type MeasureElement =
  | { type: "group"; group: Group }
  | Spacer;

// 小节（measure）包含元素数组（按显示顺序排列）
export type Measure = {
  elements: MeasureElement[];
  // 可选：小节级别属性（如节拍结束双线等）可在此处扩展
  endingDoubleBar?: boolean;
};

// 整首歌曲（最顶层结构）
export type Song = {
  title: string;             // 歌曲名
  originalArtist?: string;   // 原唱
  keySignature?: string;     // 调号 (e.g., "C", "G", "Bb", "D#m")
  baseOctave?: number;       // 基准八度 (Default: 4. Means Key=C implies 1=C4, Key=G implies 1=G4)
  measures: Measure[];       // 小节集合
};

export default Song;
