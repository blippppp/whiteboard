"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Toolbar from "./Toolbar";

export type Tool = "pen" | "eraser" | "sticky-note" | "text" | "rectangle" | "circle" | "diamond" | "arrow" | "line" | "connector" | "frame" | "select";

const SHAPE_TOOLS: Tool[] = ["rectangle", "circle", "diamond", "arrow"];
const LINE_TOOLS: Tool[] = ["line", "connector"];
const FRAME_TOOL: Tool = "frame";
const STICKY_NOTE_TEXT_COLOR = "#1a1a1a";

export interface DrawingSettings {
  tool: Tool;
  color: string;
  strokeWidth: number;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
  textBold: boolean;
  textItalic: boolean;
  textUnderline: boolean;
  textAlign: "left" | "center" | "right";
  gridSnapping: boolean;
  showGrid: boolean;
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
  votes: number;
}

interface Shape {
  id: string;
  type: "rectangle" | "circle" | "diamond" | "arrow";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  rotation: number;
}

interface Connector {
  id: string;
  type?: "line" | "connector"; // Optional for backward compatibility
  startObjectId: string | null;
  endObjectId: string | null;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
}

interface TextBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
}

interface Frame {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  color: string;
}

interface ObjectGroup {
  id: string;
  objectIds: string[];
}

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<DrawingSettings>({
    tool: "pen",
    color: "#1a1a1a",
    strokeWidth: 4,
    backgroundColor: "#ffffff",
    fontSize: 16,
    fontFamily: "sans-serif",
    textBold: false,
    textItalic: false,
    textUnderline: false,
    textAlign: "left",
    gridSnapping: false,
    showGrid: false,
  });

  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const isDrawing = useRef(false);
  const currentStroke = useRef<Stroke | null>(null);
  const strokes = useRef<Stroke[]>([]);
  const redoStack = useRef<Stroke[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [groups, setGroups] = useState<ObjectGroup[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [draggingNote, setDraggingNote] = useState<string | null>(null);
  const dragOffset = useRef<Point>({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStart = useRef<Point>({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [currentShapeStart, setCurrentShapeStart] = useState<Point | null>(null);
  const panStart = useRef<Point>({ x: 0, y: 0 });

  const getCursor = useCallback(() => {
    if (isSpacePressed) return isPanning ? "grabbing" : "grab";
    if (isPanning) return "grabbing";
    if (settings.tool === "eraser") return "cell";
    if (settings.tool === "sticky-note") return "copy";
    if (settings.tool === "select") return "default";
    if (settings.tool === "text") return "text";
    if ([...SHAPE_TOOLS, ...LINE_TOOLS, FRAME_TOOL].includes(settings.tool)) return "crosshair";
    return "crosshair";
  }, [settings.tool, isPanning, isSpacePressed]);

  const getCanvasPoint = useCallback(
    (e: { clientX: number; clientY: number }): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: ((e.clientX - rect.left) * scaleX - panOffset.x) / zoom,
        y: ((e.clientY - rect.top) * scaleY - panOffset.y) / zoom,
      };
    },
    [zoom, panOffset]
  );

  const snapToGrid = useCallback((point: Point): Point => {
    if (!settings.gridSnapping) return point;
    const gridSize = 20;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }, [settings.gridSnapping]);

  // Update selected text boxes when font settings change
  useEffect(() => {
    if (selectedObjects.length === 0) return;
    
    setTextBoxes((prev) => {
      const hasSelectedTextBoxes = prev.some((tb) => selectedObjects.includes(tb.id));
      if (!hasSelectedTextBoxes) return prev;
      
      return prev.map((tb) => {
        if (selectedObjects.includes(tb.id)) {
          return {
            ...tb,
            color: settings.color,
            fontSize: settings.fontSize,
            bold: settings.textBold,
            italic: settings.textItalic,
            underline: settings.textUnderline,
            align: settings.textAlign,
          };
        }
        return tb;
      });
    });
  }, [settings.color, settings.fontSize, settings.textBold, settings.textItalic, settings.textUnderline, settings.textAlign, selectedObjects]);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw grid if enabled
    if (settings.showGrid) {
      const gridSize = 20;
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width / zoom; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height / zoom);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height / zoom; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width / zoom, y);
        ctx.stroke();
      }
    }

    // Draw frames first (behind everything)
    for (const frame of frames) {
      ctx.save();
      ctx.strokeStyle = frame.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
      ctx.setLineDash([]);
      // Draw frame title
      ctx.fillStyle = frame.color;
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(frame.title, frame.x + 10, frame.y - 10);
      ctx.restore();
    }

    // Draw connectors
    for (const connector of connectors) {
      ctx.save();
      ctx.strokeStyle = connector.color;
      ctx.lineWidth = connector.strokeWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(connector.startX, connector.startY);
      ctx.lineTo(connector.endX, connector.endY);
      ctx.stroke();
      
      // Draw arrowhead only for connector type (default to connector for backward compatibility)
      if (!connector.type || connector.type === "connector") {
        const angle = Math.atan2(connector.endY - connector.startY, connector.endX - connector.startX);
        const arrowSize = 10;
        ctx.beginPath();
        ctx.moveTo(connector.endX, connector.endY);
        ctx.lineTo(
          connector.endX - arrowSize * Math.cos(angle - Math.PI / 6),
          connector.endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(connector.endX, connector.endY);
        ctx.lineTo(
          connector.endX - arrowSize * Math.cos(angle + Math.PI / 6),
          connector.endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw shapes
    for (const shape of shapes) {
      ctx.save();
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth;
      ctx.translate(shape.x + shape.width / 2, shape.y + shape.height / 2);
      ctx.rotate((shape.rotation * Math.PI) / 180);
      ctx.translate(-(shape.x + shape.width / 2), -(shape.y + shape.height / 2));
      
      ctx.beginPath();
      if (shape.type === "rectangle") {
        ctx.rect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;
        const radius = Math.min(shape.width, shape.height) / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      } else if (shape.type === "diamond") {
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;
        ctx.moveTo(centerX, shape.y);
        ctx.lineTo(shape.x + shape.width, centerY);
        ctx.lineTo(centerX, shape.y + shape.height);
        ctx.lineTo(shape.x, centerY);
        ctx.closePath();
      } else if (shape.type === "arrow") {
        // Simple arrow pointing right
        const headWidth = shape.width * 0.3;
        const shaftHeight = shape.height * 0.5;
        ctx.moveTo(shape.x, shape.y + (shape.height - shaftHeight) / 2);
        ctx.lineTo(shape.x + shape.width - headWidth, shape.y + (shape.height - shaftHeight) / 2);
        ctx.lineTo(shape.x + shape.width - headWidth, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height / 2);
        ctx.lineTo(shape.x + shape.width - headWidth, shape.y + shape.height);
        ctx.lineTo(shape.x + shape.width - headWidth, shape.y + (shape.height + shaftHeight) / 2);
        ctx.lineTo(shape.x, shape.y + (shape.height + shaftHeight) / 2);
        ctx.closePath();
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw strokes
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
      
      // Use quadratic curves for smooth rendering
      if (stroke.points.length === 2) {
        ctx.lineTo(stroke.points[1].x, stroke.points[1].y);
      } else if (stroke.points.length === 3) {
        // For 3 points, use quadratic curve
        ctx.quadraticCurveTo(
          stroke.points[1].x,
          stroke.points[1].y,
          stroke.points[2].x,
          stroke.points[2].y
        );
      } else {
        // For 4+ points, use smooth quadratic curves
        ctx.quadraticCurveTo(
          stroke.points[1].x,
          stroke.points[1].y,
          (stroke.points[1].x + stroke.points[2].x) / 2,
          (stroke.points[1].y + stroke.points[2].y) / 2
        );
        
        for (let i = 2; i < stroke.points.length - 1; i++) {
          const currentPoint = stroke.points[i];
          const nextPoint = stroke.points[i + 1];
          const midPoint = {
            x: (currentPoint.x + nextPoint.x) / 2,
            y: (currentPoint.y + nextPoint.y) / 2,
          };
          ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, midPoint.x, midPoint.y);
        }
        // Draw to the last point using the second last point as control
        const lastPoint = stroke.points[stroke.points.length - 1];
        const secondLastPoint = stroke.points[stroke.points.length - 2];
        ctx.quadraticCurveTo(secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [zoom, panOffset, settings.showGrid, frames, connectors, shapes]);

  const createStickyNote = useCallback((point: Point, color?: string) => {
    const snappedPoint = snapToGrid(point);
    const noteColor = color || settings.color || "#fef08a";
    const newNote: StickyNote = {
      id: crypto.randomUUID(),
      x: snappedPoint.x,
      y: snappedPoint.y,
      width: 200,
      height: 150,
      text: "",
      color: noteColor,
      votes: 0,
    };
    setStickyNotes((prev) => [...prev, newNote]);
    setSelectedNote(newNote.id);
    setSelectedObjects([newNote.id]);
    // Auto-switch back to pen tool after creating sticky note
    setSettings((prev) => ({ ...prev, tool: "pen" }));
  }, [snapToGrid, settings.color]);

  const updateStickyNote = useCallback((id: string, updates: Partial<StickyNote>) => {
    setStickyNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...updates } : note))
    );
  }, []);

  const deleteStickyNote = useCallback((id: string) => {
    setStickyNotes((prev) => prev.filter((note) => note.id !== id));
    setSelectedNote(null);
    setSelectedObjects((prev) => prev.filter((objId) => objId !== id));
  }, []);

  const duplicateStickyNote = useCallback((id: string, offsetX: number = 20, offsetY: number = 20) => {
    const note = stickyNotes.find((n) => n.id === id);
    if (!note) return;
    const newNote: StickyNote = {
      ...note,
      id: crypto.randomUUID(),
      x: note.x + offsetX,
      y: note.y + offsetY,
    };
    setStickyNotes((prev) => [...prev, newNote]);
    setSelectedNote(newNote.id);
    setSelectedObjects([newNote.id]);
  }, [stickyNotes]);

  const createShape = useCallback((type: "rectangle" | "circle" | "diamond" | "arrow", start: Point, end: Point) => {
    const snappedStart = snapToGrid(start);
    const snappedEnd = snapToGrid(end);
    const newShape: Shape = {
      id: crypto.randomUUID(),
      type,
      x: Math.min(snappedStart.x, snappedEnd.x),
      y: Math.min(snappedStart.y, snappedEnd.y),
      width: Math.abs(snappedEnd.x - snappedStart.x),
      height: Math.abs(snappedEnd.y - snappedStart.y),
      color: settings.color,
      strokeWidth: settings.strokeWidth,
      rotation: 0,
    };
    setShapes((prev) => [...prev, newShape]);
    setSelectedObjects([newShape.id]);
  }, [settings.color, settings.strokeWidth, snapToGrid]);

  const createTextBox = useCallback((point: Point) => {
    const snappedPoint = snapToGrid(point);
    const newTextBox: TextBox = {
      id: crypto.randomUUID(),
      x: snappedPoint.x,
      y: snappedPoint.y,
      width: 200,
      height: 100,
      text: "",
      color: settings.color,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      bold: settings.textBold,
      italic: settings.textItalic,
      underline: settings.textUnderline,
      align: settings.textAlign,
    };
    setTextBoxes((prev) => [...prev, newTextBox]);
    setSelectedObjects([newTextBox.id]);
  }, [settings, snapToGrid]);

  const createFrame = useCallback((start: Point, end: Point) => {
    const snappedStart = snapToGrid(start);
    const snappedEnd = snapToGrid(end);
    const newFrame: Frame = {
      id: crypto.randomUUID(),
      x: Math.min(snappedStart.x, snappedEnd.x),
      y: Math.min(snappedStart.y, snappedEnd.y),
      width: Math.abs(snappedEnd.x - snappedStart.x),
      height: Math.abs(snappedEnd.y - snappedStart.y),
      title: "Frame",
      color: "#3b82f6",
    };
    setFrames((prev) => [...prev, newFrame]);
    setSelectedObjects([newFrame.id]);
  }, [snapToGrid]);

  const createConnector = useCallback((start: Point, end: Point, type: "line" | "connector" = "connector") => {
    const snappedStart = snapToGrid(start);
    const snappedEnd = snapToGrid(end);
    const newConnector: Connector = {
      id: crypto.randomUUID(),
      type,
      startObjectId: null,
      endObjectId: null,
      startX: snappedStart.x,
      startY: snappedStart.y,
      endX: snappedEnd.x,
      endY: snappedEnd.y,
      color: settings.color,
      strokeWidth: settings.strokeWidth,
    };
    setConnectors((prev) => [...prev, newConnector]);
    setSelectedObjects([newConnector.id]);
  }, [settings.color, settings.strokeWidth, snapToGrid]);

  const groupObjects = useCallback(() => {
    if (selectedObjects.length < 2) return;
    const newGroup: ObjectGroup = {
      id: crypto.randomUUID(),
      objectIds: [...selectedObjects],
    };
    setGroups((prev) => [...prev, newGroup]);
  }, [selectedObjects]);

  const ungroupObjects = useCallback(() => {
    const objectsInGroups = selectedObjects.filter((id) =>
      groups.some((g) => g.objectIds.includes(id))
    );
    if (objectsInGroups.length === 0) return;
    setGroups((prev) =>
      prev.filter((g) => !g.objectIds.some((id) => objectsInGroups.includes(id)))
    );
  }, [selectedObjects, groups]);

  const alignObjects = useCallback((alignment: "left" | "right" | "center" | "top" | "bottom" | "middle") => {
    if (selectedObjects.length < 2) return;
    
    const selectedNotes = stickyNotes.filter((n) => selectedObjects.includes(n.id));
    const selectedShapes = shapes.filter((s) => selectedObjects.includes(s.id));
    const selectedTextBoxes = textBoxes.filter((t) => selectedObjects.includes(t.id));
    
    if (selectedNotes.length === 0 && selectedShapes.length === 0 && selectedTextBoxes.length === 0) return;

    const allObjects = [
      ...selectedNotes.map((n) => ({ id: n.id, x: n.x, y: n.y, width: n.width, height: n.height })),
      ...selectedShapes.map((s) => ({ id: s.id, x: s.x, y: s.y, width: s.width, height: s.height })),
      ...selectedTextBoxes.map((t) => ({ id: t.id, x: t.x, y: t.y, width: t.width, height: t.height })),
    ];

    let targetValue = 0;
    if (alignment === "left") {
      targetValue = Math.min(...allObjects.map((o) => o.x));
    } else if (alignment === "right") {
      targetValue = Math.max(...allObjects.map((o) => o.x + o.width));
    } else if (alignment === "center") {
      const minX = Math.min(...allObjects.map((o) => o.x));
      const maxX = Math.max(...allObjects.map((o) => o.x + o.width));
      targetValue = (minX + maxX) / 2;
    } else if (alignment === "top") {
      targetValue = Math.min(...allObjects.map((o) => o.y));
    } else if (alignment === "bottom") {
      targetValue = Math.max(...allObjects.map((o) => o.y + o.height));
    } else if (alignment === "middle") {
      const minY = Math.min(...allObjects.map((o) => o.y));
      const maxY = Math.max(...allObjects.map((o) => o.y + o.height));
      targetValue = (minY + maxY) / 2;
    }

    // Update positions
    selectedNotes.forEach((note) => {
      let newX = note.x;
      let newY = note.y;
      if (alignment === "left") newX = targetValue;
      else if (alignment === "right") newX = targetValue - note.width;
      else if (alignment === "center") newX = targetValue - note.width / 2;
      else if (alignment === "top") newY = targetValue;
      else if (alignment === "bottom") newY = targetValue - note.height;
      else if (alignment === "middle") newY = targetValue - note.height / 2;
      updateStickyNote(note.id, { x: newX, y: newY });
    });

    selectedShapes.forEach((shape) => {
      let newX = shape.x;
      let newY = shape.y;
      if (alignment === "left") newX = targetValue;
      else if (alignment === "right") newX = targetValue - shape.width;
      else if (alignment === "center") newX = targetValue - shape.width / 2;
      else if (alignment === "top") newY = targetValue;
      else if (alignment === "bottom") newY = targetValue - shape.height;
      else if (alignment === "middle") newY = targetValue - shape.height / 2;
      setShapes((prev) =>
        prev.map((s) => (s.id === shape.id ? { ...s, x: newX, y: newY } : s))
      );
    });

    selectedTextBoxes.forEach((textBox) => {
      let newX = textBox.x;
      let newY = textBox.y;
      if (alignment === "left") newX = targetValue;
      else if (alignment === "right") newX = targetValue - textBox.width;
      else if (alignment === "center") newX = targetValue - textBox.width / 2;
      else if (alignment === "top") newY = targetValue;
      else if (alignment === "bottom") newY = targetValue - textBox.height;
      else if (alignment === "middle") newY = targetValue - textBox.height / 2;
      setTextBoxes((prev) =>
        prev.map((t) => (t.id === textBox.id ? { ...t, x: newX, y: newY } : t))
      );
    });
  }, [selectedObjects, stickyNotes, shapes, textBoxes, updateStickyNote]);

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
      
      // Use quadratic curve for smoother drawing - match rendering logic
      ctx.beginPath();
      if (stroke.points.length === 2) {
        // Two points - draw straight line
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        ctx.lineTo(point.x, point.y);
      } else if (stroke.points.length === 3) {
        // Three points - draw quadratic curve
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        ctx.quadraticCurveTo(
          stroke.points[1].x,
          stroke.points[1].y,
          point.x,
          point.y
        );
      } else {
        // Four or more points - draw smooth curves between midpoints
        const prevPrev = stroke.points[stroke.points.length - 3];
        const startMid = {
          x: (prevPrev.x + prev.x) / 2,
          y: (prevPrev.y + prev.y) / 2,
        };
        const endMid = {
          x: (prev.x + point.x) / 2,
          y: (prev.y + point.y) / 2,
        };
        ctx.moveTo(startMid.x, startMid.y);
        ctx.quadraticCurveTo(prev.x, prev.y, endMid.x, endMid.y);
      }
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
      
      // Check for panning with spacebar
      if (isSpacePressed && e.nativeEvent.button === 0) {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (settings.tool === "sticky-note") {
        createStickyNote(point);
      } else if (settings.tool === "text") {
        createTextBox(point);
      } else if ((SHAPE_TOOLS as readonly Tool[]).includes(settings.tool)) {
        setCurrentShapeStart(point);
      } else if ((LINE_TOOLS as readonly Tool[]).includes(settings.tool) || settings.tool === FRAME_TOOL) {
        setCurrentShapeStart(point);
      } else if (settings.tool === "select") {
        setIsSelecting(true);
        selectionStart.current = point;
        setSelectionBox({ x: point.x, y: point.y, width: 0, height: 0 });
      } else {
        startDrawing(point);
      }
    },
    [startDrawing, getCanvasPoint, settings.tool, createStickyNote, createTextBox, isSpacePressed]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e.nativeEvent);

      // Handle panning
      if (isPanning) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        panStart.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // Handle selection box
      if (isSelecting && selectionBox) {
        const width = point.x - selectionStart.current.x;
        const height = point.y - selectionStart.current.y;
        setSelectionBox({
          x: selectionStart.current.x,
          y: selectionStart.current.y,
          width,
          height,
        });
        return;
      }

      // Handle shape drawing preview
      if (currentShapeStart) {
        redrawAll();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        ctx.save();
        ctx.translate(panOffset.x, panOffset.y);
        ctx.scale(zoom, zoom);
        ctx.strokeStyle = settings.color;
        ctx.lineWidth = settings.strokeWidth;
        ctx.setLineDash([5, 5]);
        
        const width = point.x - currentShapeStart.x;
        const height = point.y - currentShapeStart.y;
        
        if (settings.tool === "rectangle" || settings.tool === FRAME_TOOL) {
          // Rectangle or frame
          ctx.strokeRect(currentShapeStart.x, currentShapeStart.y, width, height);
        } else if (settings.tool === "circle") {
          const centerX = currentShapeStart.x + width / 2;
          const centerY = currentShapeStart.y + height / 2;
          const radius = Math.min(Math.abs(width), Math.abs(height)) / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if ((LINE_TOOLS as readonly Tool[]).includes(settings.tool)) {
          ctx.beginPath();
          ctx.moveTo(currentShapeStart.x, currentShapeStart.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        }
        
        ctx.restore();
        return;
      }

      if (settings.tool !== "sticky-note" && settings.tool !== "text" && settings.tool !== "select") {
        continueDrawing(point);
      }
    },
    [continueDrawing, getCanvasPoint, settings.tool, isPanning, isSelecting, selectionBox, currentShapeStart, settings.color, settings.strokeWidth, zoom, panOffset, redrawAll]
  );

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e.nativeEvent);

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isSelecting && selectionBox) {
      // Select objects within selection box
      const normalizedBox = {
        x: selectionBox.width >= 0 ? selectionBox.x : selectionBox.x + selectionBox.width,
        y: selectionBox.height >= 0 ? selectionBox.y : selectionBox.y + selectionBox.height,
        width: Math.abs(selectionBox.width),
        height: Math.abs(selectionBox.height),
      };

      const selected: string[] = [];
      
      // Helper to check if two boxes intersect
      const boxesIntersect = (box1: { x: number; y: number; width: number; height: number }, 
                             box2: { x: number; y: number; width: number; height: number }) => {
        return !(box1.x + box1.width < box2.x || 
                 box2.x + box2.width < box1.x || 
                 box1.y + box1.height < box2.y || 
                 box2.y + box2.height < box1.y);
      };

      stickyNotes.forEach((note) => {
        if (boxesIntersect(normalizedBox, { x: note.x, y: note.y, width: note.width, height: note.height })) {
          selected.push(note.id);
        }
      });
      shapes.forEach((shape) => {
        if (boxesIntersect(normalizedBox, { x: shape.x, y: shape.y, width: shape.width, height: shape.height })) {
          selected.push(shape.id);
        }
      });
      textBoxes.forEach((textBox) => {
        if (boxesIntersect(normalizedBox, { x: textBox.x, y: textBox.y, width: textBox.width, height: textBox.height })) {
          selected.push(textBox.id);
        }
      });

      setSelectedObjects(selected);
      setIsSelecting(false);
      setSelectionBox(null);
      return;
    }

    if (currentShapeStart) {
      const tool = settings.tool;
      if ((SHAPE_TOOLS as readonly Tool[]).includes(tool)) {
        createShape(tool as "rectangle" | "circle" | "diamond" | "arrow", currentShapeStart, point);
      } else if ((LINE_TOOLS as readonly Tool[]).includes(tool)) {
        // At this point, tool is guaranteed to be either "line" or "connector" by LINE_TOOLS check
        createConnector(currentShapeStart, point, tool as "line" | "connector");
      } else if (tool === FRAME_TOOL) {
        createFrame(currentShapeStart, point);
      }
      setCurrentShapeStart(null);
      redrawAll();
      return;
    }

    endDrawing();
  }, [endDrawing, getCanvasPoint, isPanning, isSelecting, selectionBox, currentShapeStart, settings.tool, stickyNotes, shapes, textBoxes, createShape, createConnector, createFrame, redrawAll]);

  const onMouseLeave = useCallback(() => {
    endDrawing();
    setIsPanning(false);
    setIsSelecting(false);
    setSelectionBox(null);
  }, [endDrawing]);

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
    setShapes([]);
    setConnectors([]);
    setTextBoxes([]);
    setFrames([]);
    setGroups([]);
    setSelectedNote(null);
    setSelectedObjects([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawAll();
  }, [redrawAll]);

  const handleDownload = useCallback(async () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !container) return;

    // Create an offscreen canvas for export
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    // Draw the main canvas content
    ctx.drawImage(canvas, 0, 0);

    // Draw sticky notes on the export canvas
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);
    
    for (const note of stickyNotes) {
      ctx.fillStyle = note.color;
      ctx.fillRect(note.x, note.y, note.width, note.height);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(note.x, note.y, note.width, note.height);
      
      // Draw text
      ctx.fillStyle = "#000";
      ctx.font = "14px sans-serif";
      const lines = note.text.split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, note.x + 10, note.y + 25 + i * 20, note.width - 20);
      });

      // Draw votes if any
      if (note.votes > 0) {
        ctx.fillText(`👍 ${note.votes}`, note.x + 10, note.y + note.height - 10);
      }
    }

    // Draw text boxes
    for (const textBox of textBoxes) {
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 1;
      ctx.strokeRect(textBox.x, textBox.y, textBox.width, textBox.height);
      
      ctx.fillStyle = textBox.color;
      const fontParts = [];
      if (textBox.bold) fontParts.push("bold");
      if (textBox.italic) fontParts.push("italic");
      fontParts.push(`${textBox.fontSize}px`);
      fontParts.push(textBox.fontFamily);
      ctx.font = fontParts.join(" ");
      const lines = textBox.text.split("\n");
      lines.forEach((line, i) => {
        const x = textBox.x + 10;
        const y = textBox.y + textBox.fontSize + 10 + i * (textBox.fontSize + 5);
        ctx.fillText(line, x, y, textBox.width - 20);
      });
    }

    ctx.restore();

    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = offscreen.toDataURL("image/png");
    link.click();
  }, [settings.backgroundColor, zoom, panOffset, stickyNotes, textBoxes]);

  // Zoom and pan handlers
  const handleZoom = useCallback((delta: number) => {
    setZoom((prevZoom) => {
      const newZoom = Math.max(0.1, Math.min(5, prevZoom + delta));
      return newZoom;
    });
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        handleZoom(delta);
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, [handleZoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip shortcuts when focus is on an input/textarea (check this first)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      // Track spacebar for panning
      if (e.key === " " && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
      }

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
      if (mod && e.key === "d") {
        e.preventDefault();
        // Duplicate selected objects
        if (selectedNote) {
          duplicateStickyNote(selectedNote);
        }
      }
      if (mod && e.key === "g") {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupObjects();
        } else {
          groupObjects();
        }
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
      if (!mod && e.key === "t") {
        setSettings((s) => ({ ...s, tool: "text" }));
      }
      if (!mod && e.key === "v") {
        setSettings((s) => ({ ...s, tool: "select" }));
      }
      if (!mod && e.key === "r") {
        setSettings((s) => ({ ...s, tool: "rectangle" }));
      }
      if (!mod && e.key === "c") {
        setSettings((s) => ({ ...s, tool: "circle" }));
      }
      if (!mod && e.key === "f") {
        setSettings((s) => ({ ...s, tool: "frame" }));
      }
      if (!mod && e.key === "m") {
        setShowMinimap((prev) => !prev);
      }
      if (!mod && e.key === "g") {
        setSettings((s) => ({ ...s, showGrid: !s.showGrid }));
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNote) {
          e.preventDefault();
          deleteStickyNote(selectedNote);
        }
      }
      if (e.key === "Escape") {
        setSelectedObjects([]);
        setSelectedNote(null);
        setIsSelecting(false);
        setSelectionBox(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleUndo, handleRedo, selectedNote, deleteStickyNote, duplicateStickyNote, isSpacePressed, groupObjects, ungroupObjects]);

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
        zoom={zoom}
        onZoomChange={setZoom}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        onAlign={alignObjects}
        onGroup={groupObjects}
        onUngroup={ungroupObjects}
        hasSelection={selectedObjects.length > 0}
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
              left: `${((note.x * zoom + panOffset.x) / canvasDimensions.width) * 100}%`,
              top: `${((note.y * zoom + panOffset.y) / canvasDimensions.height) * 100}%`,
              width: `${note.width * zoom}px`,
              minHeight: `${note.height * zoom}px`,
              backgroundColor: note.color,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              // Alt+Drag for duplication
              if (e.altKey) {
                duplicateStickyNote(note.id);
                return;
              }
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
                const newX = ((e.clientX - rect.left - dragOffset.current.x) * scaleX - panOffset.x) / zoom;
                const newY = ((e.clientY - rect.top - dragOffset.current.y) * scaleY - panOffset.y) / zoom;
                updateStickyNote(note.id, { x: newX, y: newY });
              }
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              setDraggingNote(null);
            }}
          >
            <textarea
              className="w-full bg-transparent border-none outline-none resize-none font-sans text-sm"
              style={{ 
                minHeight: `${note.height - 50}px`, 
                height: "auto",
                color: STICKY_NOTE_TEXT_COLOR
              }}
              value={note.text}
              placeholder="Type your note..."
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                updateStickyNote(note.id, { text: e.target.value });
                // Auto-resize based on content
                const textarea = e.target as HTMLTextAreaElement;
                textarea.style.height = "auto";
                textarea.style.height = textarea.scrollHeight + "px";
              }}
              onFocus={() => setSelectedNote(note.id)}
            />
            {note.votes > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xl">👍</span>
                <span className="text-sm font-semibold">{note.votes}</span>
              </div>
            )}
            <div className="absolute bottom-1 right-1 flex gap-1">
              <button
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 text-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  updateStickyNote(note.id, { votes: note.votes + 1 });
                }}
                title="Vote"
              >
                👍
              </button>
              <button
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteStickyNote(note.id);
                }}
                title="Delete note"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        
        {/* Text boxes */}
        {canvasDimensions.width > 0 && canvasDimensions.height > 0 && textBoxes.map((textBox) => (
          <div
            key={textBox.id}
            className={`absolute p-2 cursor-move ${selectedObjects.includes(textBox.id) ? "ring-2 ring-blue-400" : ""}`}
            style={{
              left: `${((textBox.x * zoom + panOffset.x) / canvasDimensions.width) * 100}%`,
              top: `${((textBox.y * zoom + panOffset.y) / canvasDimensions.height) * 100}%`,
              width: `${textBox.width * zoom}px`,
              minHeight: `${textBox.height * zoom}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedObjects([textBox.id]);
            }}
          >
            <textarea
              className="w-full h-full bg-transparent border border-gray-300 outline-none resize-none"
              style={{
                fontFamily: textBox.fontFamily,
                fontSize: `${textBox.fontSize}px`,
                fontWeight: textBox.bold ? "bold" : "normal",
                fontStyle: textBox.italic ? "italic" : "normal",
                textDecoration: textBox.underline ? "underline" : "none",
                textAlign: textBox.align,
                color: textBox.color,
              }}
              value={textBox.text}
              placeholder="Enter text..."
              onChange={(e) => {
                setTextBoxes((prev) =>
                  prev.map((tb) =>
                    tb.id === textBox.id ? { ...tb, text: e.target.value } : tb
                  )
                );
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ))}

        {/* Selection box */}
        {selectionBox && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
            style={{
              left: `${((selectionBox.x * zoom + panOffset.x) / canvasDimensions.width) * 100}%`,
              top: `${((selectionBox.y * zoom + panOffset.y) / canvasDimensions.height) * 100}%`,
              width: `${(selectionBox.width * zoom / canvasDimensions.width) * 100}%`,
              height: `${(selectionBox.height * zoom / canvasDimensions.height) * 100}%`,
            }}
          />
        )}

        {/* Mini-map */}
        {showMinimap && (
          <div className="absolute bottom-4 right-4 w-48 h-32 bg-white border-2 border-gray-300 rounded shadow-lg opacity-80 hover:opacity-100 transition-opacity">
            <div className="text-xs text-gray-500 p-1 text-center">Mini-map</div>
            <div className="relative w-full h-full">
              {/* Simplified view of canvas content */}
              <div className="absolute inset-0 bg-gray-100" />
            </div>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1 bg-white rounded shadow-lg p-2">
          <button
            className="px-3 py-1 hover:bg-gray-100 rounded font-bold"
            onClick={() => handleZoom(0.1)}
            title="Zoom in"
          >
            +
          </button>
          <span className="text-xs text-center text-gray-600">{Math.round(zoom * 100)}%</span>
          <button
            className="px-3 py-1 hover:bg-gray-100 rounded font-bold"
            onClick={() => handleZoom(-0.1)}
            title="Zoom out"
          >
            −
          </button>
          <button
            className="px-3 py-1 hover:bg-gray-100 rounded text-xs"
            onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}
            title="Reset view"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
