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
let overlayReady = false;
let controllerConnected = false;
let lastOverlayData = {state:"HOME"};


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







function sendKey(key, modifiers=[]){

    if(
        !mainWindow ||
        mainWindow.isDestroyed()
    )
        return;


    const win = mainWindow;


    win.webContents.sendInputEvent({

        type:"keyDown",
        keyCode:key,
        modifiers

    });



    setTimeout(()=>{


        if(
            !win ||
            win.isDestroyed()
        )
            return;



        win.webContents.sendInputEvent({

            type:"keyUp",
            keyCode:key,
            modifiers

        });


    },50);

}



function executeMediaAction(action){

    if(
        !mainWindow ||
        mainWindow.isDestroyed()
    )
        return;


    const scripts = {

        VOLUME_DOWN:
        `(()=>{const v=document.querySelector("video");if(v)v.volume=Math.max(0,v.volume-0.1);})()`,

        VOLUME_UP:
        `(()=>{const v=document.querySelector("video");if(v)v.volume=Math.min(1,v.volume+0.1);})()`,

        SKIP_BACK:
        `(()=>{const v=document.querySelector("video");if(v)v.currentTime=Math.max(0,v.currentTime-10);})()`,

        SKIP_FORWARD:
        `(()=>{const v=document.querySelector("video");if(v)v.currentTime=Math.min(v.duration,v.currentTime+10);})()`,

        HIDE_CONTROLS:
        `(()=>{document.activeElement?.blur();document.body?.click();})()`

    };


    const script = scripts[action];


    if(script){

        mainWindow.webContents.executeJavaScript(script).catch(
            error=>log("Media action failed:", action, error.message)
        );

    }

}



function openMenu(){

    if(
        !mainWindow ||
        mainWindow.isDestroyed()
    )
        return;


    mainWindow.webContents.executeJavaScript(`
        (()=>{
            const menu = document.querySelector(
                '[aria-label*="Menu" i], [title*="Menu" i], button[aria-label*="Guide" i]'
            );
            if(menu){ menu.click(); return true; }
            return false;
        })()
    `).then(
        opened=>{

            if(!opened){

                sendKey("M");

            }

        }
    ).catch(
        ()=>sendKey("M")
    );

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


        case "SEARCH":
            sendKey("/");
            break;


        case "MENU":
            openMenu();
            break;


        case "HIDE_CONTROLS":
            executeMediaAction(action);
            break;


        case "BACKSPACE":
            sendKey("BACKSPACE");
            break;


        case "CLEAR":
            sendKey("A", ["control"]);
            sendKey("BACKSPACE");
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


        case "VOLUME_DOWN":
            executeMediaAction(action);
            break;


        case "VOLUME_UP":
            executeMediaAction(action);
            break;


        case "SKIP_BACK":
            executeMediaAction(action);
            break;


        case "SKIP_FORWARD":
            executeMediaAction(action);
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

        controllerConnected=true;

        if(overlayReady){

        overlayWindow.show();

        }

    }


    if(status==="disconnected"){

        controllerConnected=false;
        overlayWindow.hide();

    }


});








ipcMain.on(
"overlay-update",
(event,data)=>{


    lastOverlayData=data;


    if(
        !overlayWindow ||
        overlayWindow.isDestroyed() ||
        !overlayReady
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
            140 * scale
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


    overlayWindow.webContents.on(
        "did-finish-load",
        ()=>{

            overlayReady=true;

            overlayWindow.webContents.send(
                "update-overlay",
                lastOverlayData
            );

            if(controllerConnected){

                overlayWindow.show();

            }

        }
    );



    overlayWindow.on(
        "closed",
        ()=>{

            overlayReady=false;
            controllerConnected=false;
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