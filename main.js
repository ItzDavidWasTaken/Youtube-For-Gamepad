const {
    app,
    BrowserWindow,
    session,
    ipcMain
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

    try {

        fs.appendFileSync(
            logFile,
            `[${new Date().toISOString()}] ${msg.join(" ")}\n`
        );

    } catch(e){}


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






function createOverlay(){


    overlayWindow =
    new BrowserWindow({

        width:600,
        height:180,

        transparent:true,

        frame:false,

        alwaysOnTop:true,

        skipTaskbar:true,

        focusable:false,


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


    overlayWindow.loadFile(
        "overlay.html"
    );


    log(
        "Overlay loaded"
    );


}







function createWindow(){


    log(
        "Creating main window"
    );



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




    log(
        "Loading YouTube TV"
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



            try {


                require("./controller")(
                    mainWindow
                );


                log(
                    "Controller loaded"
                );


            }
            catch(error){


                log(
                    "Controller error:",
                    error.stack
                );


            }


        }
    );





    mainWindow.on(
        "closed",
        ()=>{


            log(
                "Main window closed"
            );


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
        (details, callback)=>{


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


        log(
            "Windows closed"
        );


        if(process.platform !== "darwin")
            app.quit();


    }
);