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
let overlayHideTimer = null;
let playbackOverlayWatcher = null;


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



function showControllerOverlay(hideDuringPlayback=false){

    if(
        !overlayWindow ||
        overlayWindow.isDestroyed() ||
        !overlayReady
    )
        return;


    overlayWindow.show();


    if(overlayHideTimer){

        clearTimeout(overlayHideTimer);
        overlayHideTimer=null;

    }


    if(
        !hideDuringPlayback ||
        lastOverlayData?.state !== "VIDEO"
    )
        return;


    overlayHideTimer=setTimeout(()=>{

        if(
            !mainWindow ||
            mainWindow.isDestroyed() ||
            !overlayWindow ||
            overlayWindow.isDestroyed()
        )
            return;


        mainWindow.webContents.executeJavaScript(
            `(()=>{const v=document.querySelector("video");return Boolean(v&&!v.paused&&!v.ended);})()`
        ).then(
            playing=>{

                if(playing){

                    overlayWindow.hide();

                }

            }
        ).catch(
            ()=>{}
        );


    },4000);

}



function syncPlaybackOverlay(){

    if(
        !controllerConnected ||
        lastOverlayData?.state !== "VIDEO" ||
        !mainWindow ||
        mainWindow.isDestroyed()
    )
        return;


    mainWindow.webContents.executeJavaScript(`
        (()=>{
            const video=document.querySelector("video");

            if(!video || video.paused || video.ended){

                return true;

            }


            const isVisible=element=>{

                const style=getComputedStyle(element);
                const rect=element.getBoundingClientRect();


                return Boolean(
                    style.display !== "none" &&
                    style.visibility !== "hidden" &&
                    Number(style.opacity) > 0 &&
                    rect.width > 0 &&
                    rect.height > 0 &&
                    !element.closest("[aria-hidden='true']")
                );

            };


            const controlSelectors=[
                ".ytp-chrome-bottom",
                ".ytp-chrome-controls",
                "#player-controls",
                ".player-controls",
                "[class*='PlayerControls']",
                "[class*='player-controls']",
                "[class*='PlaybackControls']",
                "[class*='playback-controls']",
                "[aria-label*='pause' i]",
                "[aria-label*='play' i]",
                "[aria-label*='seek' i]",
                "[aria-label*='skip' i]"
            ];


            return controlSelectors.some(
                selector=>[...document.querySelectorAll(selector)].some(
                    element=>isVisible(element)
                )
            );
        })()
    `).then(
        controlsVisible=>{

            if(controlsVisible){

                showControllerOverlay();

            }else{

                hideControllerOverlay();

            }

        }
    ).catch(
        ()=>hideControllerOverlay()
    );

}



function hideControllerOverlay(){

    clearTimeout(overlayHideTimer);
    overlayHideTimer=null;


    if(
        overlayWindow &&
        !overlayWindow.isDestroyed()
    )
        overlayWindow.hide();

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

        SKIP_BACK:
        `(()=>{const v=document.querySelector("video");if(v)v.currentTime=Math.max(0,v.currentTime-10);})()`,

        SKIP_FORWARD:
        `(()=>{const v=document.querySelector("video");if(v)v.currentTime=Math.min(v.duration,v.currentTime+10);})()`,

    };


    const script = scripts[action];


    if(script){

        mainWindow.webContents.executeJavaScript(script).catch(
            error=>log("Media action failed:", action, error.message)
        );

    }

}




ipcMain.on(
"controller-action",
(event,action)=>{


    log(
        "Controller action:",
        action
    );


    if(lastOverlayData?.state !== "VIDEO"){

        showControllerOverlay();

    }


    switch(action){


        case "SELECT":
            sendKey("ENTER");
            break;


        case "BACK":
            sendKey("ESC");
            break;


        case "UP":
            sendKey("Up");
            break;


        case "DOWN":
            sendKey("Down");
            break;


        case "LEFT":
            sendKey("Left");
            break;


        case "RIGHT":
            sendKey("Right");
            break;


        case "PAUSE":
        case "PLAY":
            sendKey("SPACE");
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

            if(lastOverlayData?.state === "VIDEO"){

                syncPlaybackOverlay();

            }else{

                overlayWindow.show();

            }

        }

    }


    if(status==="disconnected"){

        controllerConnected=false;
        clearTimeout(overlayHideTimer);
        overlayHideTimer=null;
        hideControllerOverlay();

    }


});








ipcMain.on(
"overlay-update",
(event,data)=>{


    lastOverlayData=data;


    if(data?.state !== "VIDEO"){

        clearTimeout(overlayHideTimer);
        overlayHideTimer=null;

    }


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


    if(data?.state === "VIDEO"){

        syncPlaybackOverlay();

    }else{

        showControllerOverlay();

    }


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
            bounds.width
        );


    const height =
        Math.round(
            60 * scale
        );


    overlayWindow =
    new BrowserWindow({

        width,

        height,


        frame:false,

        transparent:true,

        useContentSize:true,


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




    overlayWindow.setAlwaysOnTop(
        true,
        "screen-saver"
    );



    overlayWindow.setBounds({

        x:Math.round(bounds.x),

        y:Math.round(bounds.y + bounds.height - height),

        width,

        height

    });



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

                if(lastOverlayData?.state === "VIDEO"){

                    syncPlaybackOverlay();

                }else{

                    overlayWindow.show();

                }

            }

        }
    );



    overlayWindow.on(
        "closed",
        ()=>{

            overlayReady=false;
            controllerConnected=false;
            hideControllerOverlay();
            clearInterval(playbackOverlayWatcher);
            playbackOverlayWatcher=null;
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


        const overlayHeight =
            Math.round(
                72 * Math.max(
                    1,
                    screen.getPrimaryDisplay().bounds.width / 1920
                )
            );


        mainWindow.webContents.insertCSS(
            `body { padding-bottom: ${overlayHeight}px !important; box-sizing: border-box !important; } * { cursor: none !important; pointer-events: none !important; } .ytp-autohide .ytp-chrome-bottom, .ytp-autohide .ytp-chrome-controls, .ytp-autohide .ytp-progress-bar-container, .ytp-autohide [class*='PlayerControls'], .ytp-autohide [class*='player-controls'], [class*='PlaybackControls'][aria-hidden='true'], [class*='playback-controls'][aria-hidden='true'] { opacity: 1 !important; visibility: visible !important; display: flex !important; }`
        );


        log(
            "YouTube TV loaded"
        );


        createOverlay();


        require("./controller")(
            mainWindow
        );


        playbackOverlayWatcher=setInterval(
            syncPlaybackOverlay,
            250
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


    mainWindow.on(
    "minimize",
    hideControllerOverlay
    );


    mainWindow.on(
    "hide",
    hideControllerOverlay
    );


    mainWindow.on(
    "restore",
    ()=>lastOverlayData?.state === "VIDEO" ?
        syncPlaybackOverlay() : showControllerOverlay()
    );


    mainWindow.on(
    "show",
    ()=>lastOverlayData?.state === "VIDEO" ?
        syncPlaybackOverlay() : showControllerOverlay()
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