# UX/PM Strategist Memory - Game of Life Studio

## Project Overview
- **Type**: Browser-based Game of Life simulation with recording/playback capabilities
- **Stack**: TypeScript, modular architecture, Canvas-based rendering, Express backend for recording storage
- **Key Files**:
  - `/src/recording-manager.ts` - Main recording logic
  - `/src/modules/simulation-controller.ts` - Play/pause/reset simulation
  - `/src/modules/session-history.ts` - In-session frame history
  - `/index.html` - UI structure
  - `/src/css/style.css` - Styling

## Current UX Issues Identified (2026-02-11)
See: `recording-ux-analysis.md` for full analysis

### Key Pain Points
1. Manual recording is friction-heavy (must remember to start recording)
2. Two separate history systems (SessionHistory + RecordingManager) cause confusion
3. No way to save a range of frames
4. Timeline UI appears in multiple places

## User Requirements (from stakeholder feedback)
- Recording should be automatic (always on)
- Only need "Save" button for recordings
- Need "Reset" button for timeframe
- Instant replay after stopping simulation
- Ability to save full run or selected range

## Design Patterns in Use
- EventBus for decoupled communication
- DomRegistry for DOM element management
- Module composition pattern (small focused classes)
- Lucide icons for UI
