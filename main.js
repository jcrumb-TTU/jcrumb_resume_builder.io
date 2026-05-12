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
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { startServer } = require('./server')

let objMainWindow = null

const createWindow = () => {
    objMainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1280,
        minHeight: 800,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            // preload.js runs before renderer scripts and
            // establishes the contextBridge channel for IPC.
            // Must be an absolute path — path.join is required.
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // Set a strict Content Security Policy on the session to prevent
    // unauthorized script execution in the renderer process.
    // connect-src must explicitly allow http://localhost:* so that
    // fetch() calls to the local Express server are not blocked —
    // the page origin is file:// so 'self' alone does not cover localhost.
    // unsafe-eval is deliberately excluded to close XSS attack surface.
    objMainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:*;"]
            }
        })
    })

    objMainWindow.loadFile(path.join(__dirname, 'index.html'))

    if(process.argv.includes('--dev')){
        objMainWindow.webContents.openDevTools()
    }
}

// ============================================================
// IPC HANDLER: export-pdf
// Receives the resume HTML string from app.js via preload.js.
// Creates a hidden BrowserWindow, loads the HTML from a temp
// file, calls Chromium's printToPDF to generate the PDF bytes,
// presents a save dialog, writes the file, and returns the
// result to the renderer.
//
// Using a temp file instead of a data URL avoids encoding
// issues with long HTML strings and special characters.
// ============================================================
ipcMain.handle('export-pdf', async (event, strHTML) => {
    let strTempPath = null
    let objPDFWindow = null

    try {
        // Step 1: Write resume HTML to a temp file.
        // app.getPath('temp') returns the OS temp directory.
        // The file is deleted after PDF generation completes.
        strTempPath = path.join(app.getPath('temp'), 'crummy_resume_temp.html')
        fs.writeFileSync(strTempPath, strHTML, 'utf8')

        // Step 2: Create a hidden BrowserWindow for rendering.
        // show: false keeps it invisible to the user.
        // No preload needed here since we only load our own HTML.
        objPDFWindow = new BrowserWindow({
            show: false,
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false
            }
        })

        // Step 3: Load the temp HTML file and wait for it
        // to fully render including fonts and layout before
        // requesting the PDF. loadFile resolves when done.
        await objPDFWindow.loadFile(strTempPath)

        // Step 4: Generate PDF using Chromium's print engine.
        // pageSize Letter = 8.5" x 11" US Letter.
        // marginsType 1 = no Electron margins so CSS @page
        // rules control all margins exclusively.
        // printBackground false = no background colors or images.
        const objPDFBuffer = await objPDFWindow.webContents.printToPDF({
            pageSize: 'Letter',
            landscape: false,
            printBackground: false,
            marginsType: 1
        })

        // Step 5: Close the hidden window and clean up the
        // temp file before showing the save dialog
        objPDFWindow.close()
        objPDFWindow = null

        try {
            fs.unlinkSync(strTempPath)
        } catch(objCleanupErr) {
            // Temp file cleanup failure is non-fatal.
            // Log it but do not interrupt the save flow.
            console.error('Temp file cleanup error:', objCleanupErr.message)
        }

        // Step 6: Show the system save dialog so the user can
        // choose where to save the PDF. defaultPath sets the
        // suggested filename in the dialog.
        const objDialogResult = await dialog.showSaveDialog({
            title: 'Save Resume as PDF',
            defaultPath: path.join(app.getPath('documents'), 'resume.pdf'),
            filters: [
                { name: 'PDF Files', extensions: ['pdf'] }
            ]
        })

        // If the user cancelled the dialog return false
        // so app.js can handle it gracefully without an error
        if(objDialogResult.canceled || !objDialogResult.filePath){
            return { blnSuccess: false }
        }

        // Step 7: Write the PDF bytes to the chosen file path
        fs.writeFileSync(objDialogResult.filePath, objPDFBuffer)

        return {
            blnSuccess: true,
            strPath: objDialogResult.filePath
        }

    } catch(objError) {
        // Clean up the hidden window if it is still open
        if(objPDFWindow && !objPDFWindow.isDestroyed()){
            objPDFWindow.close()
        }
        // Clean up temp file if it was created
        if(strTempPath){
            try { fs.unlinkSync(strTempPath) } catch(e) {}
        }
        console.error('PDF export error:', objError.message)
        return { blnSuccess: false, strError: objError.message }
    }
})

app.whenReady().then(async () => {
    await startServer()
    createWindow()

    app.on('activate', () => {
        if(BrowserWindow.getAllWindows().length === 0){
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin'){
        app.quit()
    }
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
