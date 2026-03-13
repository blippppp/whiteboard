"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Toolbar from "./Toolbar";

export type Tool = "pen" | "eraser" | "sticky-note";

export interface DrawingSettings {
  tool: Tool;
  color: string;
  strokeWidth: number;
  backgroundColor: string;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  tool: Tool;
  color: string;
  strokeWidth: number;
  points: Point[];
}

interface StickyNote {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<DrawingSettings>({
    tool: "pen",
    color: "#1a1a1a",
    strokeWidth: 4,
    backgroundColor: "#ffffff",
  });

  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1, height: 1 });

  const isDrawing = useRef(false);
  const currentStroke = useRef<Stroke | null>(null);
  const strokes = useRef<Stroke[]>([]);
  const redoStack = useRef<Stroke[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [draggingNote, setDraggingNote] = useState<string | null>(null);
  const dragOffset = useRef<Point>({ x: 0, y: 0 });

  const getCursor = useCallback(() => {
    if (settings.tool === "eraser") return "cell";
    if (settings.tool === "sticky-note") return "copy";
    return "crosshair";
  }, [settings.tool]);

  const getCanvasPoint = useCallback(
    (e: { clientX: number; clientY: number }): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes.current) {
      if (stroke.points.length < 2) continue;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
      }
      ctx.lineWidth = stroke.strokeWidth;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, []);

  const createStickyNote = useCallback((point: Point) => {
    const newNote: StickyNote = {
      id: crypto.randomUUID(),
      x: point.x,
      y: point.y,
      width: 200,
      height: 150,
      text: "",
      color: "#fef08a", // yellow-200
    };
    setStickyNotes((prev) => [...prev, newNote]);
    setSelectedNote(newNote.id);
  }, []);

  const updateStickyNote = useCallback((id: string, updates: Partial<StickyNote>) => {
    setStickyNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...updates } : note))
    );
  }, []);

  const deleteStickyNote = useCallback((id: string) => {
    setStickyNotes((prev) => prev.filter((note) => note.id !== id));
    setSelectedNote(null);
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    setCanvasDimensions({ width: canvas.width, height: canvas.height });
    redrawAll();
  }, [redrawAll]);

  useEffect(() => {
    initCanvas();
    const observer = new ResizeObserver(initCanvas);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [initCanvas]);

  // Global mouse up to stop dragging sticky notes
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggingNote(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const startDrawing = useCallback(
    (point: Point) => {
      isDrawing.current = true;
      redoStack.current = [];
      setCanRedo(false);
      currentStroke.current = {
        tool: settings.tool,
        color: settings.color,
        strokeWidth: settings.strokeWidth,
        points: [point],
      };
    },
    [settings]
  );

  const continueDrawing = useCallback(
    (point: Point) => {
      if (!isDrawing.current || !currentStroke.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const stroke = currentStroke.current;
      const prev = stroke.points[stroke.points.length - 1];
      stroke.points.push(point);

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
      }
      ctx.lineWidth = stroke.strokeWidth;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  const endDrawing = useCallback(() => {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;
    if (currentStroke.current.points.length > 1) {
      strokes.current.push(currentStroke.current);
      setCanUndo(true);
    }
    currentStroke.current = null;
  }, []);

  // Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e.nativeEvent);
      if (settings.tool === "sticky-note") {
        createStickyNote(point);
      } else {
        startDrawing(point);
      }
    },
    [startDrawing, getCanvasPoint, settings.tool, createStickyNote]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (settings.tool !== "sticky-note") {
        continueDrawing(getCanvasPoint(e.nativeEvent));
      }
    },
    [continueDrawing, getCanvasPoint, settings.tool]
  );

  const onMouseUp = useCallback(() => endDrawing(), [endDrawing]);
  const onMouseLeave = useCallback(() => endDrawing(), [endDrawing]);

  // Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      startDrawing(getCanvasPoint(e.touches[0]));
    },
    [startDrawing, getCanvasPoint]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      continueDrawing(getCanvasPoint(e.touches[0]));
    },
    [continueDrawing, getCanvasPoint]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      endDrawing();
    },
    [endDrawing]
  );

  const handleUndo = useCallback(() => {
    if (strokes.current.length === 0) return;
    const last = strokes.current.pop()!;
    redoStack.current.push(last);
    setCanUndo(strokes.current.length > 0);
    setCanRedo(true);
    redrawAll();
  }, [redrawAll]);

  const handleRedo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    strokes.current.push(next);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    redrawAll();
  }, [redrawAll]);

  const handleClear = useCallback(() => {
    strokes.current = [];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);
    setStickyNotes([]);
    setSelectedNote(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Render on a white background for the download
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = offscreen.toDataURL("image/png");
    link.click();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip shortcuts when focus is on an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      if (mod && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      if (!mod && e.key === "p") {
        setSettings((s) => ({ ...s, tool: "pen" }));
      }
      if (!mod && e.key === "e") {
        setSettings((s) => ({ ...s, tool: "eraser" }));
      }
      if (!mod && e.key === "n") {
        setSettings((s) => ({ ...s, tool: "sticky-note" }));
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNote) {
          e.preventDefault();
          deleteStickyNote(selectedNote);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, selectedNote, deleteStickyNote]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Toolbar
        settings={settings}
        onSettingsChange={setSettings}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onDownload={handleDownload}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <div ref={containerRef} className="flex-1 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundColor: settings.backgroundColor,
            cursor: getCursor(),
            touchAction: "none",
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
        {/* Sticky notes */}
        {canvasDimensions.width > 0 && canvasDimensions.height > 0 && stickyNotes.map((note) => (
          <div
            key={note.id}
            className={`absolute p-3 rounded-lg shadow-lg cursor-move transition-shadow ${selectedNote === note.id ? "ring-2 ring-blue-400 shadow-xl" : ""}`}
            style={{
              left: `${(note.x / canvasDimensions.width) * 100}%`,
              top: `${(note.y / canvasDimensions.height) * 100}%`,
              width: `${note.width}px`,
              minHeight: `${note.height}px`,
              backgroundColor: note.color,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setSelectedNote(note.id);
              setDraggingNote(note.id);
              const rect = e.currentTarget.getBoundingClientRect();
              dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              };
            }}
            onMouseMove={(e) => {
              if (draggingNote === note.id) {
                e.stopPropagation();
                const canvas = canvasRef.current;
                const container = containerRef.current;
                if (!canvas || !container) return;
                const rect = container.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const newX = (e.clientX - rect.left - dragOffset.current.x) * scaleX;
                const newY = (e.clientY - rect.top - dragOffset.current.y) * scaleY;
                updateStickyNote(note.id, { x: newX, y: newY });
              }
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              setDraggingNote(null);
            }}
          >
            <textarea
              className="w-full h-full bg-transparent border-none outline-none resize-none font-sans text-sm"
              style={{ minHeight: `${note.height - 24}px` }}
              value={note.text}
              placeholder="Type your note..."
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateStickyNote(note.id, { text: e.target.value })}
              onFocus={() => setSelectedNote(note.id)}
            />
            <button
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                deleteStickyNote(note.id);
              }}
              title="Delete note"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
