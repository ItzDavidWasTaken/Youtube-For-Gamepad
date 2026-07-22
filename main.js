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

        backgroundColor: "#000000",

        webPreferences: {

            contextIsolation: true,
            nodeIntegration: false

        }

    });


    // Force TV user agent
    mainWindow.webContents.setUserAgent(
        TV_USER_AGENT
    );


    // Load YouTube TV
    mainWindow.loadURL(
        "https://www.youtube.com/tv"
    );


    // Start controller after YouTube has loaded
    mainWindow.webContents.on(
        "did-finish-load",
        () => {

            console.log(
                "YouTube TV loaded"
            );


            try {

                require("./controller")(
                    mainWindow
                );


                console.log(
                    "Controller started"
                );


            }
            catch(error) {


                console.error(
                    "Controller failed:",
                    error
                );


            }

        }
    );


    mainWindow.on(
        "closed",
        () => {

            mainWindow = null;

        }
    );

}



app.whenReady().then(async () => {


    // Clear old desktop-mode cookies/cache
    await session.defaultSession.clearCache();


    // Force TV user agent on every request
    session.defaultSession.webRequest.onBeforeSendHeaders(
        (details, callback) => {


            details.requestHeaders[
                "User-Agent"
            ] = TV_USER_AGENT;


            callback({
                requestHeaders:
                    details.requestHeaders
            });


        }
    );


    createWindow();


});



app.on(
    "window-all-closed",
    () => {

        if (process.platform !== "darwin") {

            app.quit();

        }

    }
);