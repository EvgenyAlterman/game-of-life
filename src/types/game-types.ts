/**
 * Type definitions for Conway's Game of Life Studio
 */

// Core game types
export interface GridPosition {
  row: number;
  col: number;
}

export interface CellState {
  isAlive: boolean;
  maturity: number;
  deadTime: number;
  fadeLevel: number;
}

export interface GameRules {
  birthRules: number[];
  survivalRules: number[];
}

export interface GameSettings {
  cellSize: number;
  rows: number;
  cols: number;
  speed: number;
  showGrid: boolean;
  showPixelGrid: boolean;
  showFade: boolean;
  showMaturity: boolean;
  fadeDuration: number;
  maturityColor: string;
  customRules: GameRules;
}

export interface GameSnapshot {
  grid: boolean[][];
  maturityGrid: number[][];
  deadGrid: number[][];
  fadeGrid: number[][];
  generation: number;
  population: number;
  rows: number;
  cols: number;
  birthRules: number[];
  survivalRules: number[];
}

export interface GenerationUpdate {
  grid: boolean[][];
  generation: number;
  population: number;
}

// Pattern types
export interface PatternCategory {
  name: string;
  description: string;
  icon: string;
  subcategories?: Record<string, PatternSubcategory>;
}

export interface PatternSubcategory {
  name: string;
  icon: string;
  description: string;
}

export interface Pattern {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  period: number | string;
  velocity?: [number, number];
  discoverer: string;
  year: number;
  pattern: number[][];
  key?: string;
}

export interface PatternLibrary {
  categories: Record<string, PatternCategory>;
  [patternName: string]: any; // More flexible to allow methods and patterns
}

// Recording types
export interface RecordingFrame {
  timestamp: number;
  generation: number;
  grid: boolean[][];
  population: number;
}

export interface RecordingData {
  generations: RecordingFrame[];
  settings: GameSettings;
  metadata: {
    totalGenerations: number;
    duration: number;
    ruleString: string;
  };
}

export interface SavedRecording {
  name: string;
  timestamp: number;
  generations: RecordingFrame[];
  settings: GameSettings;
  totalGenerations: number;
}

export interface RecordingListItem {
  id: string;
  name: string;
  timestamp: number;
  totalGenerations: number;
  date: string;
  time: string;
  ruleString?: string;
}

// UI types
export interface UIElements {
  [key: string]: HTMLElement | null;
}

export interface CanvasRenderingContext2DWithReset extends CanvasRenderingContext2D {
  reset: () => void;
}

// Event types
export interface MouseEventInfo {
  gridRow: number;
  gridCol: number;
  canvasX: number;
  canvasY: number;
}

export interface TouchEventInfo extends MouseEventInfo {
  touches: TouchList;
}

// Server API types
export interface APIResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface SaveRecordingRequest {
  name: string;
  data: RecordingData;
}

export interface SaveRecordingResponse extends APIResponse {
  fileName?: string;
}

// Utility types
export type EventCallback = (...args: any[]) => void;

export type AnimationFrameCallback = (timestamp: number) => void;

export interface Dimensions {
  width: number;
  height: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// Enums
export enum CellShape {
  Square = 'square',
  Circle = 'circle'
}

export enum PlaybackState {
  Stopped = 'stopped',
  Playing = 'playing',
  Paused = 'paused',
  Recording = 'recording'
}

// Drawing mode
export type DrawingMode =
  | 'cell'
  | 'inspector'
  | 'selection'
  | 'eraser'
  | 'line'
  | 'rectangle'
  | 'circle'
  | `pattern:${string}`
  | `custom:${string}`;

// Shape preview for line/rectangle/circle tools
export interface ShapePreviewData {
  type: 'line' | 'rectangle' | 'circle';
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

// Module state interfaces — used by SettingsPersistence to gather/distribute state
export interface VisualSettingsState {
  showGrid: boolean;
  showPixelGrid: boolean;
  showFade: boolean;
  showMaturity: boolean;
  fadeDuration: number;
  maturityColor: string;
  cellShape: string;
}

export interface SimulationState {
  speed: number;
  isRunning: boolean;
}

export interface GridState {
  rows: number;
  cols: number;
  cellSize: number;
}

export interface CustomPattern {
  name: string;
  category: string;
  pattern: number[][];
}

export interface SelectionBounds {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface PatternPreviewData {
  pattern: number[][];
  row: number;
  col: number;
}

// Re-export EventMap from event-bus for convenience
export type { EventMap } from '../core/event-bus';
