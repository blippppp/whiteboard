"use client";

import { DrawingSettings, Tool } from "./Whiteboard";

interface ToolbarProps {
  settings: DrawingSettings;
  onSettingsChange: (s: DrawingSettings) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onDownload: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onZoomChange: (z: number) => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onAlign?: (alignment: "left" | "right" | "center" | "top" | "bottom" | "middle") => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  hasSelection: boolean;
}

const PRESET_COLORS = [
  "#1a1a1a",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ffffff",
];

const STROKE_WIDTHS = [2, 4, 8, 16];

function IconButton({
  onClick,
  disabled,
  title,
  children,
  active,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
        ${active ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}

function ToolButton({
  tool,
  currentTool,
  onSelect,
  title,
  children,
}: {
  tool: Tool;
  currentTool: Tool;
  onSelect: (t: Tool) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onSelect(tool)}
      title={title}
      aria-label={title}
      aria-pressed={tool === currentTool}
      className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
        ${tool === currentTool ? "bg-blue-600 text-white shadow-sm" : "hover:bg-gray-100 text-gray-700"}
      `}
    >
      {children}
    </button>
  );
}

// SVG icons
function PenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H7L3 16l10-10 7 7-3.5 3.5" />
      <path d="M6.5 17.5l4-4" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function StickyNoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
      <path d="M15 3v6h6" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function RectangleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L22 12 L12 22 L2 12 Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  );
}

function ConnectorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <line x1="8" y1="8" x2="16" y2="16" />
    </svg>
  );
}

function FrameIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2" ry="2" strokeDasharray="4 4" />
    </svg>
  );
}

function SelectIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

const STICKY_NOTE_COLORS = [
  { name: "Yellow", color: "#fef08a" },
  { name: "Pink", color: "#fbcfe8" },
  { name: "Blue", color: "#bfdbfe" },
  { name: "Green", color: "#bbf7d0" },
  { name: "Orange", color: "#fed7aa" },
  { name: "Purple", color: "#e9d5ff" },
];

export default function Toolbar({
  settings,
  onSettingsChange,
  onUndo,
  onRedo,
  onClear,
  onDownload,
  canUndo,
  canRedo,
  zoom,
  onZoomChange,
  showMinimap,
  onToggleMinimap,
  onAlign,
  onGroup,
  onUngroup,
  hasSelection,
}: ToolbarProps) {
  const setTool = (tool: Tool) =>
    onSettingsChange({ ...settings, tool });

  const setColor = (color: string) =>
    onSettingsChange({ ...settings, color, tool: "pen" });

  const setStrokeWidth = (strokeWidth: number) =>
    onSettingsChange({ ...settings, strokeWidth });

  const setBackgroundColor = (backgroundColor: string) =>
    onSettingsChange({ ...settings, backgroundColor });

  const setFontSize = (fontSize: number) =>
    onSettingsChange({ ...settings, fontSize });

  const toggleTextBold = () =>
    onSettingsChange({ ...settings, textBold: !settings.textBold });

  const toggleTextItalic = () =>
    onSettingsChange({ ...settings, textItalic: !settings.textItalic });

  const toggleTextUnderline = () =>
    onSettingsChange({ ...settings, textUnderline: !settings.textUnderline });

  const toggleGridSnapping = () =>
    onSettingsChange({ ...settings, gridSnapping: !settings.gridSnapping });

  const toggleShowGrid = () =>
    onSettingsChange({ ...settings, showGrid: !settings.showGrid });

  return (
    <header className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 shadow-sm flex-wrap">
      {/* App name */}
      <span className="font-bold text-gray-800 text-lg mr-2 select-none">
        ✏️ Whiteboard
      </span>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Tools */}
      <ToolButton tool="select" currentTool={settings.tool} onSelect={setTool} title="Select (V)">
        <SelectIcon />
      </ToolButton>
      <ToolButton tool="pen" currentTool={settings.tool} onSelect={setTool} title="Pen (P)">
        <PenIcon />
      </ToolButton>
      <ToolButton tool="eraser" currentTool={settings.tool} onSelect={setTool} title="Eraser (E)">
        <EraserIcon />
      </ToolButton>
      <ToolButton tool="sticky-note" currentTool={settings.tool} onSelect={setTool} title="Sticky Note (N)">
        <StickyNoteIcon />
      </ToolButton>
      <ToolButton tool="text" currentTool={settings.tool} onSelect={setTool} title="Text (T)">
        <TextIcon />
      </ToolButton>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Shapes */}
      <ToolButton tool="rectangle" currentTool={settings.tool} onSelect={setTool} title="Rectangle (R)">
        <RectangleIcon />
      </ToolButton>
      <ToolButton tool="circle" currentTool={settings.tool} onSelect={setTool} title="Circle (C)">
        <CircleIcon />
      </ToolButton>
      <ToolButton tool="diamond" currentTool={settings.tool} onSelect={setTool} title="Diamond">
        <DiamondIcon />
      </ToolButton>
      <ToolButton tool="arrow" currentTool={settings.tool} onSelect={setTool} title="Arrow">
        <ArrowIcon />
      </ToolButton>
      <ToolButton tool="line" currentTool={settings.tool} onSelect={setTool} title="Line">
        <LineIcon />
      </ToolButton>
      <ToolButton tool="connector" currentTool={settings.tool} onSelect={setTool} title="Connector">
        <ConnectorIcon />
      </ToolButton>
      <ToolButton tool="frame" currentTool={settings.tool} onSelect={setTool} title="Frame (F)">
        <FrameIcon />
      </ToolButton>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Colors */}
      <div className="flex items-center gap-1" role="group" aria-label="Color picker">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            title={c}
            aria-label={`Color ${c}`}
            aria-pressed={settings.color === c && settings.tool === "pen"}
            className={`w-6 h-6 rounded-full border-2 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-400
              ${settings.color === c && settings.tool === "pen"
                ? "border-blue-500 scale-125"
                : "border-gray-300 hover:scale-110"}
            `}
            style={{ backgroundColor: c }}
          />
        ))}
        {/* Custom color */}
        <label title="Custom color" className="relative cursor-pointer">
          <span className="sr-only">Custom color</span>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center overflow-hidden
            ${!PRESET_COLORS.includes(settings.color) && settings.tool === "pen"
              ? "border-blue-500 scale-125"
              : "border-gray-300 hover:scale-110"}
          `}
            style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
          />
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            value={settings.color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Custom color picker"
          />
        </label>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Stroke width */}
      <div className="flex items-center gap-1" role="group" aria-label="Stroke width">
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w}
            onClick={() => setStrokeWidth(w)}
            title={`Stroke width ${w}px`}
            aria-label={`Stroke width ${w}px`}
            aria-pressed={settings.strokeWidth === w}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
              ${settings.strokeWidth === w ? "bg-blue-100" : "hover:bg-gray-100"}
            `}
          >
            <div
              className="rounded-full bg-gray-700"
              style={{ width: Math.min(w * 2, 24), height: Math.min(w * 2, 24) }}
            />
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Background color */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 select-none">Background:</span>
        <label title="Background color" className="relative cursor-pointer">
          <span className="sr-only">Background color</span>
          <div 
            className="w-6 h-6 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
            style={{ backgroundColor: settings.backgroundColor }}
          />
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            value={settings.backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            aria-label="Background color picker"
          />
        </label>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Text formatting (shown when text tool is active) */}
      {settings.tool === "text" && (
        <>
          <select
            value={settings.fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
            title="Font size"
          >
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="24">24px</option>
            <option value="32">32px</option>
            <option value="48">48px</option>
          </select>
          <IconButton onClick={toggleTextBold} active={settings.textBold} title="Bold">
            <strong>B</strong>
          </IconButton>
          <IconButton onClick={toggleTextItalic} active={settings.textItalic} title="Italic">
            <em>I</em>
          </IconButton>
          <IconButton onClick={toggleTextUnderline} active={settings.textUnderline} title="Underline">
            <u>U</u>
          </IconButton>
          <div className="w-px h-6 bg-gray-200 mx-1" />
        </>
      )}

      {/* Sticky note colors (shown when sticky-note tool is active) */}
      {settings.tool === "sticky-note" && (
        <>
          <span className="text-sm text-gray-600 select-none">Note color:</span>
          {STICKY_NOTE_COLORS.map((sc) => (
            <button
              key={sc.color}
              onClick={() => onSettingsChange({ ...settings, color: sc.color })}
              title={sc.name}
              className="w-6 h-6 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: sc.color }}
            />
          ))}
          <div className="w-px h-6 bg-gray-200 mx-1" />
        </>
      )}

      {/* Grid and snap options */}
      <IconButton onClick={toggleShowGrid} active={settings.showGrid} title="Show Grid (G)">
        <GridIcon />
      </IconButton>
      <IconButton onClick={toggleGridSnapping} active={settings.gridSnapping} title="Snap to Grid">
        <span className="text-xs font-bold">SNAP</span>
      </IconButton>
      <IconButton onClick={onToggleMinimap} active={showMinimap} title="Toggle Mini-map (M)">
        <MapIcon />
      </IconButton>

      {/* Alignment tools (shown when objects are selected) */}
      {hasSelection && onAlign && (
        <>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <IconButton onClick={() => onAlign("left")} title="Align Left">
            <span className="text-xs font-bold">⫷</span>
          </IconButton>
          <IconButton onClick={() => onAlign("center")} title="Align Center">
            <span className="text-xs font-bold">⫼</span>
          </IconButton>
          <IconButton onClick={() => onAlign("right")} title="Align Right">
            <span className="text-xs font-bold">⫸</span>
          </IconButton>
          <IconButton onClick={() => onAlign("top")} title="Align Top">
            <span className="text-xs font-bold">⫯</span>
          </IconButton>
          <IconButton onClick={() => onAlign("middle")} title="Align Middle">
            <span className="text-xs font-bold">⊟</span>
          </IconButton>
          <IconButton onClick={() => onAlign("bottom")} title="Align Bottom">
            <span className="text-xs font-bold">⫰</span>
          </IconButton>
        </>
      )}

      {/* Grouping tools */}
      {hasSelection && onGroup && onUngroup && (
        <>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <IconButton onClick={onGroup} title="Group (Ctrl+G)">
            <span className="text-xs font-bold">GRP</span>
          </IconButton>
          <IconButton onClick={onUngroup} title="Ungroup (Ctrl+Shift+G)">
            <span className="text-xs font-bold">UNGRP</span>
          </IconButton>
        </>
      )}

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Actions */}
      <IconButton onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <UndoIcon />
      </IconButton>
      <IconButton onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
        <RedoIcon />
      </IconButton>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <IconButton onClick={onDownload} title="Download as PNG">
        <DownloadIcon />
      </IconButton>
      <IconButton onClick={onClear} title="Clear canvas">
        <TrashIcon />
      </IconButton>
    </header>
  );
}
