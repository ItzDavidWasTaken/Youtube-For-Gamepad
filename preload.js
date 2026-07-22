const {
    contextBridge,
    ipcRenderer
} = require("electron");


contextBridge.exposeInMainWorld(
    "controllerAPI",
    {

        sendAction:(action)=>{

            ipcRenderer.send(
                "controller-action",
                action
            );

        },


        sendStatus:(status)=>{

            ipcRenderer.send(
                "controller-status",
                status
            );

        },


        setState:(state)=>{

            ipcRenderer.send(
                "controller-state",
                state
            );

        },


        sendOverlay:(data)=>{

            ipcRenderer.send(
                "overlay-update",
                data
            );

        },


        onOverlay:(callback)=>{

            ipcRenderer.on(
                "update-overlay",
                (event,data)=>callback(data)
            );

        }

    }
);