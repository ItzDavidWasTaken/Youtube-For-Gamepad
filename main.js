const {
    app,
    BrowserWindow,
    session
} = require("electron");

const fs = require("fs");
const path = require("path");


let mainWindow;


// Log file location
const logFile = path.join(
    app.getPath("userData"),
    "youtube-tv-debug.log"
);


function log(...args) {

    const message =
        `[${new Date().toISOString()}] `
        + args.join(" ")
        + "\n";


    try {

        fs.appendFileSync(
            logFile,
            message
        );

    }
    catch(e) {

        console.error(
            "Could not write log:",
            e
        );

    }


    console.log(
        ...args
    );

}



process.on(
    "uncaughtException",
    (error)=>{

        log(
            "UNCAUGHT EXCEPTION:",
            error.stack
        );

    }
);


process.on(
    "unhandledRejection",
    (error)=>{

        log(
            "UNHANDLED REJECTION:",
            error.stack || error
        );

    }
);



const TV_USER_AGENT =
    "Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/7.0 TV Safari/537.36";



function createWindow() {


    log(
        "Creating window"
    );


    mainWindow = new BrowserWindow({

        width:1920,
        height:1080,

        fullscreen:true,
        kiosk:true,

        autoHideMenuBar:true,

        backgroundColor:"#000000",

        webPreferences:{

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


        setTimeout(()=>{


            try {


                log(
                    "Starting controller"
                );


                require("./controller")(
                    mainWindow
                );


                log(
                    "Controller started"
                );


            }
            catch(error) {


                log(
                    "Controller failed:",
                    error.stack
                );


            }


        }, 5000);


    }
);


    mainWindow.on(
        "closed",
        ()=>{

            log(
                "Window closed"
            );

            mainWindow = null;

        }
    );


}



app.whenReady().then(async ()=>{


    log(
        "Application starting"
    );


    await session.defaultSession.clearCache();


    session.defaultSession.webRequest.onBeforeSendHeaders(
        (details, callback)=>{


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
    ()=>{


        log(
            "All windows closed"
        );


        if(process.platform !== "darwin") {

            app.quit();

        }


    }
);