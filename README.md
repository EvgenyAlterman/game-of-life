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
│       ├── gameoflife.js  # Main game logic + recording functionality  
│       └── patterns.js    # Pattern definitions (ES6 module)
├── saves/                 # Recording storage directory
├── index.html            # Main HTML with timeline & recording UI
├── package.json          # Dependencies & scripts
├── vite.config.js        # Vite configuration
└── README.md            # This file
```

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
