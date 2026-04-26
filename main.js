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
