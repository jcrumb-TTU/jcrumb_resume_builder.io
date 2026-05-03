const path = require('path')
const {app, BrowserWindow} = require('electron')
const {startServer} = require('./server')

let objMainWindow = null

const createWindow = () => {
    objMainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1280,
        minHeight: 800,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
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
