const {
    app,
    BrowserWindow,
    session,
    ipcMain,
    screen
} = require("electron");

const path = require("path");
const fs = require("fs");


let mainWindow;
let overlayWindow;


const TV_USER_AGENT =
"Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/7.0 TV Safari/537.36";


const logFile = path.join(
    app.getPath("userData"),
    "youtube-tv-debug.log"
);



function log(...msg){

    try{

        fs.appendFileSync(
            logFile,
            `[${new Date().toISOString()}] ${msg.join(" ")}\n`
        );

    }catch{}

    console.log(...msg);

}



function sendKey(key){

    if(!mainWindow)
        return;


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
            "Controller action:",
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

        }

    }
);





ipcMain.on(
    "controller-status",
    (event,status)=>{


        log(
            "Controller status:",
            status
        );


        if(!overlayWindow)
            return;


        if(status === "connected"){

            overlayWindow.show();

        }


        if(status === "disconnected"){

            overlayWindow.hide();

        }


    }
);






function createOverlay(){


    overlayWindow =
    new BrowserWindow({

        width:900,
        height:120,

        frame:false,

        transparent:true,

        alwaysOnTop:true,

        skipTaskbar:true,

        focusable:false,

        show:false,


        webPreferences:{

            preload:path.join(
                __dirname,
                "preload.js"
            ),

            contextIsolation:true,

            nodeIntegration:false

        }

    });



    overlayWindow.setIgnoreMouseEvents(
        true
    );


    overlayWindow.setAlwaysOnTop(
        true,
        "screen-saver"
    );



    const display =
        screen.getPrimaryDisplay();


    const bounds =
        display.bounds;


    overlayWindow.setPosition(

        Math.round(
            bounds.x +
            (bounds.width - 900) / 2
        ),

        bounds.height - 160

    );



    overlayWindow.loadFile(
        "overlay.html"
    );



    log(
        "Overlay created"
    );


}








function createWindow(){


    mainWindow =
    new BrowserWindow({

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
                "YouTube TV loaded"
            );


            createOverlay();


            require("./controller")(
                mainWindow
            );


        }
    );



    mainWindow.on(
        "closed",
        ()=>{


            if(overlayWindow){

                overlayWindow.close();

                overlayWindow=null;

            }


            mainWindow=null;


        }
    );


}







app.whenReady().then(async()=>{


    log(
        "Application starting"
    );


    await session.defaultSession.clearCache();



    session.defaultSession.webRequest.onBeforeSendHeaders(
        (details,callback)=>{


            details.requestHeaders[
                "User-Agent"
            ] =
            TV_USER_AGENT;



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
    ()=>{


        if(process.platform !== "darwin")
            app.quit();


    }
);