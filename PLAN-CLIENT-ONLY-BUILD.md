# Client-Only Release Build Plan

## Overview

Transform the Game of Life application into a completely standalone frontend-only application that can be deployed to any static hosting (S3, Amplify, Netlify, etc.).

**Build Output**: `dist-client/` directory containing all static files ready for deployment.

---

## Current State Analysis

| Aspect | Current | Target |
|--------|---------|--------|
| **Build Output** | `dist/` (~116 KB gzipped) | `dist-client/` (dedicated) |
| **Server Dependency** | Express.js API for recordings | None |
| **Storage** | Server filesystem + localStorage | IndexedDB + file export/import |
| **Deployment** | Requires Node.js server | Static files only |

### Server Dependencies Found

The recording system makes 4 API calls in `src/recording-manager.ts`:
- **Line 523**: `POST /api/recordings` - Save recording
- **Line 543**: `GET /api/recordings` - List recordings
- **Line 583**: `GET /api/recordings/:id` - Load recording
- **Line 709**: `DELETE /api/recordings/:id` - Delete recording

---

## Implementation Plan

### Phase 1: Create Client-Only Storage Adapter

**Goal**: Replace server API calls with IndexedDB storage

#### 1.1 Create IndexedDB Storage Service
- **File**: `src/core/indexeddb-storage.ts`
- **Purpose**: Provide persistent storage for recordings using browser IndexedDB
- **Features**:
  - Store recordings as blobs/JSON objects
  - Handle larger data than localStorage (recordings can be large)
  - Async API matching current fetch patterns

```typescript
// API to implement:
interface RecordingStorage {
  saveRecording(recording: RecordingData): Promise<string>; // returns id
  getRecordings(): Promise<RecordingMetadata[]>;
  getRecording(id: string): Promise<RecordingData | null>;
  deleteRecording(id: string): Promise<void>;
}
```

#### 1.2 Modify Recording Manager
- **File**: `src/recording-manager.ts`
- **Changes**:
  - Replace `fetch('/api/recordings', ...)` calls with IndexedDB storage calls
  - Remove server error handling specific to HTTP
  - Add graceful fallback if IndexedDB is unavailable

### Phase 2: Export/Import Recordings Feature

**Goal**: Allow users to export and import recordings as JSON files

#### 2.1 Export Functionality
- **Single Recording Export**: Download individual recording as `.json` file
- **Export All**: Download all recordings as a single `.json` file (array format)
- **File naming**: `recording-{name}-{timestamp}.json` or `all-recordings-{timestamp}.json`

#### 2.2 Import Functionality
- **Single Recording Import**: Load one recording from `.json` file
- **Bulk Import**: Load multiple recordings from a single `.json` file
- **Validation**: Verify imported data structure before saving
- **Duplicate Handling**: Generate new IDs to avoid conflicts

#### 2.3 UI Changes
- Add export button (download icon) next to each recording in the list
- Add "Export All" button in recordings panel header
- Add "Import" button in recordings panel header
- File picker for import (accepts `.json` files)

### Phase 3: Build Configuration

#### 3.1 Create Client-Only Vite Config
- **File**: `vite.config.client.ts` (new)
- **Output Directory**: `dist-client/`
- **Changes**:
  - Remove API proxy configuration
  - Set `outDir: 'dist-client'`
  - Production optimizations enabled

#### 3.2 Update package.json Scripts
```json
{
  "build:release": "vite build --config vite.config.client.ts",
  "preview:release": "vite preview --config vite.config.client.ts"
}
```

### Phase 4: Cleanup & Isolation

#### 4.1 Keep Server Code Intact
- Server code remains for local development (`npm run dev`)
- Original `vite.config.ts` unchanged for dev builds
- `dist/` used for server builds, `dist-client/` for release builds

#### 4.2 .gitignore Update
- Add `dist-client/` to `.gitignore` (build artifact)

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `src/core/indexeddb-storage.ts` | IndexedDB wrapper for recordings |
| `vite.config.client.ts` | Client-only build config, outputs to `dist-client/` |

### Modified Files
| File | Changes |
|------|---------|
| `src/recording-manager.ts` | Replace fetch calls with IndexedDB, add export/import |
| `package.json` | Add `build:release` and `preview:release` scripts |
| `.gitignore` | Add `dist-client/` |

### Unchanged (kept for dev)
| File/Directory | Reason |
|----------------|--------|
| `server/` | Still used for local development |
| `vite.config.ts` | Original config for dev builds |
| `dist/` | Server build output |

---

## Build Output

```
dist-client/
├── index.html              # Entry point
├── explanation.html        # Help page
└── assets/
    ├── main-[hash].js      # Bundled application
    └── main-[hash].css     # Bundled styles
```

**To build**: `npm run build:release`
**To preview**: `npm run preview:release`
**To deploy**: Upload contents of `dist-client/` to any static host

---

## Testing Plan

### Unit Tests
1. IndexedDB storage service tests
2. Recording manager with mocked storage
3. Export/Import validation tests

### Manual Testing
1. Full game functionality without server running
2. Save recording → verify persists after refresh
3. Export single recording → verify JSON structure
4. Export all recordings → verify array format
5. Import single recording → verify appears in list
6. Import bulk recordings → verify all appear
7. Settings persistence
8. Theme switching

### Build Testing
1. Run `npm run build:release`
2. Verify `dist-client/` created with all files
3. Run `npm run preview:release`
4. Test all features in preview mode

---

## Rollback Strategy

- Server code remains intact
- Original `vite.config.ts` unchanged
- `npm run dev` still works with server
- IndexedDB storage is additive

---

## Build & Deploy Checklist

- [ ] Run `npm run build:release`
- [ ] Verify `dist-client/` contains: `index.html`, `explanation.html`, `assets/`
- [ ] Test locally with `npm run preview:release`
- [ ] Test recording save/load (no server)
- [ ] Test export single recording
- [ ] Test export all recordings
- [ ] Test import recordings
- [ ] Upload `dist-client/` contents to static host

---

## Estimated Scope

| Phase | Files | Complexity |
|-------|-------|------------|
| Phase 1: Storage Adapter | 2 | Medium |
| Phase 2: Export/Import | 1 | Medium |
| Phase 3: Build Config | 2 | Low |
| Phase 4: Cleanup | 2 | Low |

**Total New/Modified Files**: 5 files

---

## Architecture Decisions

### Why IndexedDB for Storage?

| Option | Pros | Cons |
|--------|------|------|
| **localStorage** | Simple, synchronous | 5MB limit, blocks UI |
| **IndexedDB** ✓ | Large storage, async, structured | More complex API |
| **Remove recordings** | Simplest | Loses feature |

**Decision**: IndexedDB - recordings can be large, need async non-blocking storage.

### Export/Import File Format

```json
// Single recording export
{
  "version": 1,
  "type": "single",
  "recording": {
    "id": "...",
    "name": "...",
    "frames": [...],
    "metadata": {...}
  }
}

// All recordings export
{
  "version": 1,
  "type": "collection",
  "recordings": [
    { "id": "...", "name": "...", ... },
    { "id": "...", "name": "...", ... }
  ]
}
```

### Build Output Directory

**`dist-client/`** - Separate from `dist/` to:
- Avoid confusion with server builds
- Allow both builds to coexist
- Clear deployment target
