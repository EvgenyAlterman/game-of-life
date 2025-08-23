# Conway's Game of Life - Full Stack Edition 🚀

A modern, full-stack implementation of Conway's Game of Life with **recording and replay functionality**!

## ✨ New Features

### 🎬 **Recording & Timeline System**
- **Record every generation** of your simulation
- **Timeline slider** to scrub through recorded generations
- **Playback controls** with adjustable speed (1x to 10x)
- **Save recordings** to disk with custom names
- **Load and replay** saved recordings anytime

### 🔧 **Full-Stack Architecture**
- **Vite dev server** with HMR (Hot Module Replacement)
- **Express.js backend** for saving/loading recordings
- **REST API** for recording management
- **File system storage** in `saves/` directory

### 🎮 **Enhanced UI**
- **Record button** - Start/stop recording with visual feedback
- **Finish button** - Complete recording and show timeline
- **Timeline controls** - Play, pause, stop, and seek through recordings
- **Recordings manager** - Browse, play, and delete saved recordings
- **Modal dialogs** - Clean interface for saving recordings

## 📁 Project Structure

```
game of life/
├── server/                 # Express.js backend
│   └── index.js           # API server with recording endpoints
├── src/                   # Frontend source (Vite)
│   ├── css/
│   │   └── style.css      # All styles including new timeline UI
│   └── js/
│       ├── GameOfLifeComplete.js  # 🆕 Main orchestrator (modular)
│       ├── gameoflife.js         # Legacy monolithic file (2,956 lines)
│       ├── core/
│       │   └── GameEngine.js     # Pure Conway's Game of Life logic
│       ├── renderer/
│       │   └── CanvasRenderer.js # Canvas drawing operations
│       ├── features/
│       │   ├── MaturitySystem.js # Cell age tracking
│       │   ├── FadeSystem.js     # Ghost trail effects
│       │   ├── CellInspector.js  # Cell inspection mode
│       │   └── FullscreenManager.js # Fullscreen functionality
│       ├── patterns/
│       │   └── PatternLibrary.js # Pattern definitions & search
│       └── utils/
│           ├── Constants.js      # Application configuration
│           ├── EventEmitter.js   # Event coordination
│           └── ColorUtils.js     # Color manipulation
├── saves/                 # Recording storage directory
├── index.html            # Main HTML with timeline & recording UI
├── package.json          # Dependencies & scripts
├── vite.config.js        # Vite configuration
└── README.md            # This file
```

## 🏗️ **Modular Architecture Refactoring** ✅ **COMPLETED**

### 🔄 **Before vs After**

**❌ Before**: Single monolithic `gameoflife.js` file with **2,956 lines** mixing all concerns:
- Game logic, rendering, UI, patterns, settings, features all in one file
- Difficult to maintain, test, and extend
- High coupling between different functionalities

**✅ After**: Clean **modular ES6 architecture** with **11+ focused modules**:
- Each module has a single, clear responsibility
- Event-driven communication via EventBus pattern
- Easy to test, maintain, and extend
- Full feature parity with enhanced functionality

### 🎯 **Architecture Benefits Achieved**

- **✅ Separation of Concerns**: Game logic, rendering, and UI are completely separated
- **✅ Single Responsibility**: Each module handles exactly one aspect of the application
- **✅ Event-Driven Design**: Modules communicate via clean event interfaces
- **✅ Easy Testing**: Individual modules can be tested in isolation
- **✅ Better Maintainability**: Changes are localized to specific modules
- **✅ Enhanced Readability**: Code is organized logically by functionality
- **✅ Improved Scalability**: New features can be added without touching existing code
- **✅ Reusable Components**: Modules can be used in other projects

### 🧪 **Testing the Modular Architecture**

Visit `http://localhost:3000/test-modular.html` to run comprehensive tests of the new modular system!

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server (with HMR)
```bash
npm run dev
```

This starts:
- **Frontend**: `http://localhost:3000` (Vite dev server)
- **Backend**: `http://localhost:3001` (Express API server)

### 3. Production Build
```bash
npm run build
npm start
```

## 🎬 How to Use Recording

### **📹 Recording a Simulation**
1. **Set up your simulation** - Place patterns, adjust settings
2. **Click Record button** 🔴 - Starts recording (button pulses red)
3. **Start simulation** - Click Play ▶️ to begin
4. **Click Finish** 💾 when done - Stops recording and shows timeline

### **⏯️ Timeline Controls**
- **Play/Pause** - Watch recorded simulation
- **Timeline slider** - Scrub to any generation
- **Speed control** - Adjust playback speed (1x-10x)
- **Frame counter** - Shows current/total generations

### **💾 Saving Recordings**
1. After clicking **Finish**, a modal appears
2. **Enter recording name**
3. **Review stats** (generations, duration)
4. **Click Save** - Saves to `saves/` folder

### **📂 Managing Recordings**
- **Load button** - Refresh recordings list
- **Play button** - Load and auto-play recording
- **Delete button** - Remove recording (with confirmation)

## 🔧 API Endpoints

The Express server provides these endpoints:

- `GET /api/recordings` - List all recordings
- `POST /api/recordings` - Save new recording
- `GET /api/recordings/:id` - Load specific recording
- `DELETE /api/recordings/:id` - Delete recording
- `GET /api/health` - Server health check

## 🎯 Advanced Features

### **🔄 Pattern Rotation**
- Select any pattern tool
- Press `[` and `]` to rotate patterns
- **Ghost preview** shows rotated pattern placement
- Keyboard hints appear in bottom panel

### **📐 Grid Overlay**
- **Grid toggle** in sidebar
- Shows **thick lines every 5 cells**
- Perfect for **precise pattern placement**
- Works like **Photoshop's grid system**

### **🌙 Dark Mode**
- **Theme toggle** in header
- **System theme detection**
- **Persistent preferences**
- All recording UI **adapts to theme**

### **💾 Full State Persistence**
- **Game settings** saved to localStorage
- **Grid state** preserved between sessions
- **UI preferences** remembered
- **30-day expiry** for saved data

## 🔧 Development

### **Hot Module Replacement (HMR)**
- **Instant updates** during development
- **State preservation** across reloads
- **CSS hot reloading**
- **Component hot swapping**

### **Modern Build System**
- **Vite** for lightning-fast builds
- **ES6 modules** throughout
- **Tree shaking** for optimal bundles
- **Dev/production** optimization

## 🎮 Workflow Examples

### **🔬 Research Workflow**
1. Create interesting pattern
2. Start recording
3. Run simulation for many generations
4. Save as "Research - Glider Gun Evolution"
5. Share recording file with others

### **🎨 Art Creation Workflow**
1. Design complex initial state
2. Record evolution
3. Find beautiful intermediate states
4. Use timeline to capture perfect moments
5. Export patterns from specific generations

### **🏫 Educational Workflow**
1. Record classic patterns (Glider, Blinker, etc.)
2. Save each as separate recording
3. Use timeline to demonstrate evolution
4. Step-by-step analysis of generations

## 🚀 What's New from Simple Version

| Feature | Before | Now |
|---------|--------|-----|
| **Architecture** | Static HTML/CSS/JS | Full-stack Vite + Express |
| **Recording** | ❌ None | ✅ Every generation captured |
| **Replay** | ❌ None | ✅ Full timeline with scrubbing |
| **Storage** | Browser localStorage only | File system + API |
| **Dev Experience** | Manual refresh | HMR + hot reloading |
| **UI** | Basic controls | Professional timeline interface |
| **Sharing** | Screenshot only | Save/load recording files |

Your Conway's Game of Life is now a **professional-grade simulation tool** with full recording capabilities! 🎉✨

## 🏗️ **Modular Architecture**

### 🔧 **Refactored Codebase** 
The application has been refactored into a clean, modular architecture for better maintainability:

```
src/js/
├── core/
│   └── GameEngine.js          # Pure Conway's Game of Life logic
├── renderer/
│   └── CanvasRenderer.js      # All canvas drawing operations
├── features/
│   ├── CellInspector.js       # Interactive cell inspection
│   ├── FadeSystem.js          # Ghost trail effects
│   └── MaturitySystem.js      # Cell age visualization
├── utils/
│   ├── Constants.js           # Application constants
│   ├── EventEmitter.js        # Inter-module communication
│   └── ColorUtils.js          # Color manipulation utilities
└── patterns/
    └── PatternLibrary.js      # 100+ Conway's Game patterns
```

### ✅ **Benefits**
- **Maintainable**: 60-320 lines per module vs 2,697 line monolith
- **Testable**: Each module can be unit tested independently  
- **Reusable**: Modules can be used in other projects
- **Scalable**: Easy to add new features without breaking existing code
- **Event-driven**: Loose coupling between systems

### 🧪 **Demo Available**
Try the new modular architecture with `docs/demo-refactored.html` - shows the clean separation of concerns and module integration.

## 🖥️ **Fullscreen Mode**

### ✨ **Immersive Experience**
- **Full-Screen Toggle**: Click the maximize button to expand canvas to entire screen
- **Proportional Scaling**: Canvas grows to fit your screen while maintaining pixel consistency
- **Hover Controls**: Move mouse to top of screen to reveal play/pause and exit controls
- **Keyboard Shortcuts**: Press `SPACE` to play/pause simulation in fullscreen mode
- **Pattern Preservation**: Your current game state is perfectly centered when entering fullscreen
- **All Features Supported**: Fade mode, maturity visualization, and inspector mode work in fullscreen

### 🎮 **Perfect for**
- **Large Pattern Exploration**: Maximum canvas space for complex simulations
- **Presentations**: Clean, distraction-free interface
- **Focus Sessions**: Immersive Conway's Game of Life experience
- **Pattern Discovery**: More space to observe emergent behaviors
