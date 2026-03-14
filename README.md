# ✏️ Whiteboard

A modern, feature-rich collaborative whiteboard application built with **Next.js** and **Tailwind CSS**, inspired by tools like Miro. Perfect for brainstorming, diagramming, and collaborative planning.

## Features

### ✨ Core Drawing Tools
- 🖊️ **Freehand drawing** with smooth strokes
- 🧹 **Eraser** tool
- 🎨 **Color picker** (9 presets + custom)
- 📏 **Stroke width** selector (4 sizes: 2px, 4px, 8px, 16px)
- 🌈 **Background color** customization

### 📝 Sticky Notes
- ✨ **Multiple colors** (Yellow, Pink, Blue, Green, Orange, Purple)
- 📐 **Auto-resize** based on text content
- 🔄 **Quick duplication** with `Alt + Drag`
- 👍 **Voting feature** - add vote dots to notes
- 📊 **Vote counting** - automatically displays vote count
- ✏️ **Easy editing** after creation

### 🔷 Shapes and Connectors
- 📦 **Rectangle** tool
- ⭕ **Circle** tool  
- 💎 **Diamond** tool
- ➡️ **Arrow** shape tool
- 📏 **Line** tool
- 🔗 **Connector** tool with arrowheads
- 🎨 **Customizable** colors and stroke widths

### 🖼️ Frames / Sections
- 📦 **Frame creation** for grouping content
- 🏷️ **Frame titles** and boundaries
- 📊 **Visual organization** with dashed borders
- 🎯 **Perfect for presentations** and structured boards

### 🗺️ Canvas Navigation
- 🔍 **Smooth zoom** in/out with `Ctrl + Mouse Wheel`
- 🖱️ **Zoom controls** with +/- buttons and percentage display
- 🗺️ **Mini-map** for navigating large boards (toggle with `M`)
- 🔄 **Reset view** button to return to 100% zoom
- 📐 **Grid display** (toggle with `Ctrl + G`)
- 🧲 **Snap to grid** option for precise alignment

### 📝 Rich Text Tool
- ✏️ **Text boxes** with border
- 📏 **Font size** selection (12px to 48px)
- **B** **Bold** formatting
- *I* *Italic* formatting
- <u>U</u> **Underline** formatting
- 🎨 **Text color** customization
- 📦 **Resizable** and movable text boxes

### 🎯 Selection and Interaction
- 👆 **Select tool** for object manipulation
- 🔲 **Selection box** for multi-select (drag to select multiple objects)
- ↩️ **Undo / Redo** with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- 🗑️ **Delete** selected objects (Delete or Backspace key)
- 📋 **Duplicate** objects (Ctrl+D for sticky notes)
- ❌ **Deselect** with Escape key

### 💾 Export and Sharing
- 📥 **Download** whiteboard as PNG
- 🖼️ **High-quality export** with white background

### ⌨️ Keyboard Shortcuts
- `P` - Pen tool
- `E` - Eraser tool
- `N` - Sticky note tool
- `T` - Text tool
- `V` - Select tool
- `R` - Rectangle tool
- `C` - Circle tool
- `F` - Frame tool
- `M` - Toggle mini-map
- `Ctrl + Z` - Undo
- `Ctrl + Shift + Z` or `Ctrl + Y` - Redo
- `Ctrl + D` - Duplicate selected object
- `Ctrl + G` - Group selected objects
- `Ctrl + Shift + G` - Ungroup selected objects
- `G` - Toggle grid display
- `Delete` or `Backspace` - Delete selected object
- `Escape` - Deselect all
- `Ctrl + Mouse Wheel` - Zoom in/out

### 📱 Mobile Support
- 📱 **Touch support** for tablets and phones
- 🖐️ **Touch drawing** with smooth gestures

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/blippppp/whiteboard)

Or use the Vercel CLI:

```bash
npx vercel
```

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
