const {
    app,
    BrowserWindow,
    session
} = require("electron");

const path = require("path");

let mainWindow;


const TV_USER_AGENT =
    "Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/7.0 TV Safari/537.36";


function createWindow() {

    mainWindow = new BrowserWindow({

        width: 1920,
        height: 1080,

        fullscreen: true,
        kiosk: true,

        autoHideMenuBar: true,

        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }

    });


    mainWindow.webContents.setUserAgent(
        TV_USER_AGENT
    );


    mainWindow.loadURL(
        "https://www.youtube.com/tv"
    );

}


app.whenReady().then(async () => {


    await session.defaultSession.clearCache();


    session.defaultSession.webRequest.onBeforeSendHeaders(
        (details, callback) => {

            details.requestHeaders["User-Agent"] =
                TV_USER_AGENT;


            callback({
                requestHeaders:
                    details.requestHeaders
            });

        }
    );


    createWindow();

});