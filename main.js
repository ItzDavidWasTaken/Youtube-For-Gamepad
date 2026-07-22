const {
    app,
    BrowserWindow,
    ipcMain
} = require("electron");

const path = require("path");


let mainWindow;


function createWindow() {

    mainWindow = new BrowserWindow({

        width: 1920,
        height: 1080,

        fullscreen: true,
        kiosk: true,

        autoHideMenuBar: true,

        backgroundColor: "#000000",

        webPreferences: {

            preload: path.join(
                __dirname,
                "overlay.js"
            ),

            nodeIntegration: false,
            contextIsolation: false

        }

    });


    mainWindow.loadURL(
        "https://www.youtube.com/tv"
    );


    mainWindow.on(
        "closed",
        () => {
            mainWindow = null;
        }
    );


    require("./controller")(
        mainWindow
    );

}



app.whenReady().then(()=>{

    createWindow();

});


app.on(
    "window-all-closed",
    ()=>{

        if(process.platform !== "darwin")
            app.quit();

    }
);