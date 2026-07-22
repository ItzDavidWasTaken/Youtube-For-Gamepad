const {
    app,
    BrowserWindow,
    session,
    ipcMain,
    screen
} = require("electron");

const path = require("path");
const fs = require("fs");


let mainWindow = null;
let overlayWindow = null;


const TV_USER_AGENT =
"Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/7.0 TV Safari/537.36";



const logFile =
path.join(
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

    if(
        !mainWindow ||
        mainWindow.isDestroyed()
    )
        return;


    const win = mainWindow;


    win.webContents.sendInputEvent({

        type:"keyDown",
        keyCode:key

    });



    setTimeout(()=>{


        if(
            !win ||
            win.isDestroyed()
        )
            return;



        win.webContents.sendInputEvent({

            type:"keyUp",
            keyCode:key

        });


    },50);

}








ipcMain.on(
"controller-action",
(event,action)=>{


    log(
        "Controller action:",
        action
    );


    switch(action){


        case "SELECT":
        case "CONFIRM":
            sendKey("ENTER");
            break;


        case "BACK":
        case "CLOSE":
            sendKey("ESC");
            break;


        case "UP":
            sendKey("ARROWUP");
            break;


        case "DOWN":
            sendKey("ARROWDOWN");
            break;


        case "LEFT":
            sendKey("ARROWLEFT");
            break;


        case "RIGHT":
            sendKey("ARROWRIGHT");
            break;


        case "PAUSE":
        case "PLAY":
            sendKey("SPACE");
            break;


    }


});








ipcMain.on(
"controller-status",
(event,status)=>{


    log(
        "Controller:",
        status
    );


    if(
        !overlayWindow ||
        overlayWindow.isDestroyed()
    )
        return;



    if(status==="connected"){

        overlayWindow.show();

    }


    if(status==="disconnected"){

        overlayWindow.hide();

    }


});








ipcMain.on(
"overlay-update",
(event,data)=>{


    if(
        !overlayWindow ||
        overlayWindow.isDestroyed()
    )
        return;



    overlayWindow.webContents.send(
        "update-overlay",
        data
    );


});









function createOverlay(){


    const display =
        screen.getPrimaryDisplay();


    const bounds =
        display.bounds;



    // Scale overlay based on resolution

    const scale =
        Math.max(
            1,
            bounds.width / 1920
        );



    const width =
        Math.round(
            320 * scale
        );


    const height =
        Math.round(
            100 * scale
        );



    overlayWindow =
    new BrowserWindow({

        width,

        height,


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



    overlayWindow.setPosition(

        Math.round(
            bounds.x + (bounds.width - width) / 2
        ),


        Math.round(
            bounds.y + bounds.height - height - (40 * scale)
        )

    );



    overlayWindow.loadFile(
        "overlay.html"
    );



    overlayWindow.on(
        "closed",
        ()=>{

            overlayWindow=null;

        }
    );


}









function createWindow(){



    const display =
        screen.getPrimaryDisplay();


    const bounds =
        display.bounds;



    mainWindow =
    new BrowserWindow({

        width:bounds.width,

        height:bounds.height,


        fullscreen:true,

        kiosk:true,


        autoHideMenuBar:true,


        backgroundColor:"#000000",


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


        require("./controller")(
            mainWindow
        );


    });



    mainWindow.on(
    "closed",
    ()=>{


        if(
            overlayWindow &&
            !overlayWindow.isDestroyed()
        ){

            overlayWindow.close();

        }


        overlayWindow=null;

        mainWindow=null;


    });


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


    });



    createWindow();


});







app.on(
"window-all-closed",
()=>{


    if(
        process.platform !== "darwin"
    ){

        app.quit();

    }


});