# 📁 Local File Manager

A secure, cross-platform file manager integrated into your Electron application. Browse, manage, and organize files with a native-like experience while maintaining strict security boundaries.

## 🎯 Features

### File Operations

- ✅ Browse folders and files with a clean interface
- ✅ Create new folders
- ✅ Rename files and folders
- ✅ Delete files (move to Trash/Recycle Bin or permanent)
- ✅ Copy and paste files
- ✅ Cut and paste (move) files
- ✅ Multi-select with checkboxes
- ✅ Search files by name
- ✅ Show/hide hidden files (dot files)

### System Integration

- ✅ Open files with default system application
- ✅ Reveal files in Finder (macOS) / Explorer (Windows)
- ✅ Breadcrumb navigation
- ✅ File type and size display
- ✅ Last modified timestamps

### User Experience

- ✅ Responsive toolbar with quick actions
- ✅ Keyboard shortcuts ready (copy/paste work)
- ✅ Visual feedback for selections
- ✅ Loading states and error handling
- ✅ Clipboard tracking (copy/move operations)

## 🏗️ Architecture

### Security Model

The file manager implements **defense-in-depth** security:

```
┌─────────────────────────────────────────────────────────┐
│                    Renderer Process                      │
│  (React UI - No direct filesystem access)               │
│                                                          │
│  FilesPage.tsx → window.fileManager API                 │
└──────────────────────┬──────────────────────────────────┘
                       │ IPC (contextBridge)
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   Preload Script                         │
│  (Exposes typed API via contextBridge)                  │
│                                                          │
│  fileManagerAPI → ipcRenderer.invoke()                  │
└──────────────────────┬──────────────────────────────────┘
                       │ IPC Channel
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   Main Process                           │
│  (Filesystem operations with validation)                │
│                                                          │
│  ipcMain.handle() → fs operations                       │
│  • Path validation (no traversal)                       │
│  • Root path scoping                                    │
│  • Input sanitization                                   │
└─────────────────────────────────────────────────────────┘
```

### Key Security Features

1. **Root Path Scoping**: All operations are locked to the user-selected folder
2. **Path Traversal Prevention**: `validatePath()` ensures no `../` escapes
3. **Context Isolation**: Renderer has zero direct filesystem access
4. **Input Validation**: File/folder names sanitized, no path separators allowed
5. **Type Safety**: Fully typed API contract with TypeScript

## 📂 File Structure

```
src/
├── main/
│   ├── index.ts                 # Registers file manager handlers
│   └── fileManager.ts           # Core filesystem operations
├── preload/
│   ├── index.ts                 # Exposes fileManager API
│   └── index.d.ts               # TypeScript definitions
├── renderer/src/
│   ├── pages/
│   │   └── FilesPage.tsx        # Main file manager UI
│   ├── types/
│   │   └── fileManager.ts       # Shared type definitions
│   └── constants/
│       └── routes.ts            # Route configuration
```

## 🚀 Usage

### Accessing the File Manager

1. Navigate to **Files** in the sidebar menu
2. Click **"Choose Folder"** to select a root folder
3. Browse, search, and manage files within that folder

### Operations

#### Select Folder

```typescript
// User clicks "Choose Folder"
// Opens native file dialog
// Sets root path - all operations scoped to this folder
```

#### Create Folder

```typescript
// Click "New Folder" button
// Enter folder name
// Creates folder in current directory
```

#### Copy/Paste Files

```typescript
// Select files with checkboxes
// Click "Copy" button
// Navigate to destination folder
// Click "Paste" button
```

#### Delete Files

```typescript
// Select files with checkboxes
// Click "Delete" button
// Choose "Move to Trash" (safe) or "Delete Permanently"
```

#### Search Files

```typescript
// Type in search box (top right)
// Filters files by name (case-insensitive)
```

#### Show Hidden Files

```typescript
// Click eye icon in toolbar
// Toggles visibility of files starting with '.'
```

## 🔒 Security Guarantees

### What's Protected

✅ **Path Traversal**: Cannot access files outside chosen root folder  
✅ **No Direct FS Access**: Renderer cannot call `fs` module directly  
✅ **Input Validation**: File names sanitized, dangerous patterns blocked  
✅ **Typed API**: TypeScript prevents malformed requests

### What's NOT Protected (by design)

⚠️ **Chosen Root Folder**: User explicitly grants access  
⚠️ **System Dialogs**: Native open/save dialogs have full filesystem access  
⚠️ **Electron APIs**: `shell.openPath` executes files (by user request)

### Attack Surface Mitigation

```typescript
// Example: Path validation prevents traversal
const validatePath = (root: string, target: string) => {
  const resolved = path.resolve(target)
  const rootResolved = path.resolve(root)

  if (!resolved.startsWith(rootResolved)) {
    throw new Error('Path traversal detected')
  }

  return resolved
}
```

## 🛠️ API Reference

### Window API

The file manager exposes a typed API via `window.fileManager`:

```typescript
// Select folder dialog
window.fileManager.selectFolder(): Promise<string | null>

// List files in directory
window.fileManager.listFiles(
  folderPath: string,
  options: ListOptions
): Promise<FileItem[]>

// Create new folder
window.fileManager.createFolder(
  parentPath: string,
  folderName: string
): Promise<void>

// Rename file/folder
window.fileManager.rename(
  oldPath: string,
  newName: string
): Promise<void>

// Delete files (to trash or permanent)
window.fileManager.remove(
  paths: string[],
  options: { toTrash: boolean }
): Promise<void>

// Copy files
window.fileManager.copy(
  sourcePaths: string[],
  destPath: string
): Promise<void>

// Move files
window.fileManager.move(
  sourcePaths: string[],
  destPath: string
): Promise<void>

// Open file with default app
window.fileManager.openFile(path: string): Promise<void>

// Reveal in Finder/Explorer
window.fileManager.openInExplorer(path: string): Promise<void>

// Path utilities
window.fileManager.joinPath(...paths: string[]): Promise<string>
window.fileManager.getParentPath(path: string): Promise<string>
```

### Types

```typescript
interface FileItem {
  name: string
  path: string
  relativePath: string
  type: 'file' | 'directory'
  size: number
  modified: number
  isHidden: boolean
  extension?: string
}

interface ListOptions {
  showHidden: boolean
  sortBy?: 'name' | 'type' | 'size' | 'modified'
  sortDirection?: 'asc' | 'desc'
  searchQuery?: string
}

interface DeleteOptions {
  toTrash: boolean
}
```

## 🎨 Customization

### Adding Custom Actions

To add a custom file operation:

1. **Add IPC handler** in `src/main/fileManager.ts`:

```typescript
ipcMain.handle('fileManager:customAction', async (event, filePath: string) => {
  // Validate path
  const validatedPath = validatePath(rootPath, filePath)
  // Your custom logic
})
```

2. **Expose in preload** (`src/preload/index.ts`):

```typescript
customAction: (filePath: string) => ipcRenderer.invoke('fileManager:customAction', filePath)
```

3. **Update types** (`src/preload/index.d.ts`):

```typescript
customAction: (filePath: string) => Promise<void>
```

4. **Use in UI** (`src/renderer/src/pages/FilesPage.tsx`):

```typescript
const handleCustomAction = async (path: string) => {
  await window.fileManager.customAction(path)
}
```

## 📦 Dependencies

- **Electron**: 28+ (uses `shell.trashItem`, `shell.openPath`)
- **React**: 18+ (hooks, suspense)
- **TypeScript**: 5+ (type safety)
- **Node**: 18+ (fs/promises, path)

No additional native dependencies required!

## ✅ Platform Support

| Platform      | Support    | Notes                                       |
| ------------- | ---------- | ------------------------------------------- |
| macOS 12+     | ✅ Full    | Trash via `shell.trashItem`                 |
| Windows 10/11 | ✅ Full    | Recycle Bin via `shell.trashItem`           |
| Linux         | ⚠️ Partial | Trash support varies by desktop environment |

## 🐛 Known Limitations

1. **Hidden Files on Windows**: Only dot files detected; Windows attributes not fully checked
2. **Large Folders**: UI can slow with 1000+ items (consider virtualization)
3. **Progress Tracking**: Copy/move operations don't show real-time progress yet
4. **Drag-Drop**: Not yet implemented (planned feature)
5. **Thumbnails**: No image previews currently

## 🔮 Roadmap

- [ ] Drag-and-drop support (OS → app, in-app reordering)
- [ ] File thumbnails for images
- [ ] Progress bars for long operations
- [ ] Batch rename tool
- [ ] File compression (zip)
- [ ] Context menu (right-click)
- [ ] Grid view option
- [ ] Remember last folder (electron-store)
- [ ] Keyboard navigation (arrow keys, enter)
- [ ] Virtualized list (react-window)

## 📝 License

This file manager component is part of your Electron application. No separate license required.

## 🤝 Contributing

To modify the file manager:

1. Types are in `src/renderer/src/types/fileManager.ts`
2. Main process logic in `src/main/fileManager.ts`
3. Preload exposure in `src/preload/index.ts`
4. UI in `src/renderer/src/pages/FilesPage.tsx`

Always test security boundaries when making changes!

---

**Built with ❤️ for secure, cross-platform file management**
