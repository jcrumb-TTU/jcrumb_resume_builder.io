// ============================================================
// This file was generated through a collaborative process
// combining Claude Sonnet 4.6 (Anthropic) and AI-assisted
// code generation tools across multiple development phases.
// Prompts used to produce this code were crafted using
// Claude Sonnet 4.6 and were designed to operate within
// the parameters covered in CSC 3100 during the Spring
// Semester of 2026, referencing the course AGENT.md
// conventions and class code examples developed throughout
// the semester. The author reviewed, oversaw, and approved
// all generated code prior to final commit and push to
// the project repository.
// ============================================================
// ============================================================
// preload.js
// Runs in a privileged bridge context between the Electron
// main process and the renderer process. Uses contextBridge
// to safely expose IPC channels to app.js without enabling
// nodeIntegration in the renderer.
//
// contextIsolation: true means app.js cannot access Node.js
// directly. contextBridge is the secure approved channel for
// exposing specific main process capabilities to the renderer.
// ============================================================

const { contextBridge, ipcRenderer } = require('electron')

// Expose a controlled electronAPI object to window in app.js.
// Only the specific methods listed here are accessible.
// The renderer cannot access ipcRenderer directly.
contextBridge.exposeInMainWorld('electronAPI', {

    // exportPDF sends the assembled resume HTML string to the
    // main process which renders it in a hidden BrowserWindow
    // and saves the resulting PDF via a save dialog.
    // Returns { blnSuccess: true, strPath: '...' } on success
    // or { blnSuccess: false } if the user cancels the dialog.
    exportPDF: (strHTML) => ipcRenderer.invoke('export-pdf', strHTML)

})

// ============================================================
// This file was generated through a collaborative process
// combining Claude Sonnet 4.6 (Anthropic) and AI-assisted
// code generation tools across multiple development phases.
// Prompts used to produce this code were crafted using
// Claude Sonnet 4.6 and were designed to operate within
// the parameters covered in CSC 3100 during the Spring
// Semester of 2026, referencing the course AGENT.md
// conventions and class code examples developed throughout
// the semester. The author reviewed, oversaw, and approved
// all generated code prior to final commit and push to
// the project repository.
// ============================================================
