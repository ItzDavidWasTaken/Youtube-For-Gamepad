const {
    app,
    BrowserWindow,
    BrowserView,
    session,
    ipcMain
} = require("electron");

const path = require("path");
const fs = require("fs");


let mainWindow;


const TV_USER_AGENT =
"Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/7.0 TV Safari/537.36";


const logFile = path.join(
    app.getPath("userData"),
    "youtube-tv-debug.log"
);


function log(...msg){

    fs.appendFileSync(
        logFile,
        `[${new Date().toISOString()}] ${msg.join(" ")}\n`
    );

}



function sendKey(key){

    if(!mainWindow) return;


    mainWindow.webContents.sendInputEvent({

        type:"keyDown",
        keyCode:key

    });


    setTimeout(()=>{

        mainWindow.webContents.sendInputEvent({

            type:"keyUp",
            keyCode:key

        });

    },50);

}



ipcMain.on(
    "controller-action",
    (event, action)=>{


        log(
            "Controller:",
            action
        );


        switch(action){

            case "UP":
                sendKey("UP");
                break;

            case "DOWN":
                sendKey("DOWN");
                break;

            case "LEFT":
                sendKey("LEFT");
                break;

            case "RIGHT":
                sendKey("RIGHT");
                break;

            case "SELECT":
                sendKey("ENTER");
                break;

            case "BACK":
                sendKey("ESC");
                break;

            case "PLAY":
                sendKey("SPACE");
                break;

            case "HOME":
                sendKey("HOME");
                break;

        }

    }
);



function createWindow(){


    mainWindow = new BrowserWindow({

        width:1920,
        height:1080,

        fullscreen:true,
        kiosk:true,

        autoHideMenuBar:true,

        webPreferences:{

            preload:path.join(
                __dirname,
                "preload.js"
            ),

            contextIsolation:true,
            nodeIntegration:false

        }

    });



    mainWindow.webContents.setUserAgent(
        TV_USER_AGENT
    );


    mainWindow.loadURL(
        "https://www.youtube.com/tv"
    );



    mainWindow.webContents.on(
        "did-finish-load",
        ()=>{

            log(
                "YouTube loaded"
            );


            require("./controller")(
                mainWindow
            );


        }
    );

}



app.whenReady().then(async()=>{


    log(
        "Starting"
    );


    await session.defaultSession.clearCache();


    session.defaultSession.webRequest.onBeforeSendHeaders(
        (details,callback)=>{


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