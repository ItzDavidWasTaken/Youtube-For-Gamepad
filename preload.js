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


        showOverlay:(data)=>{

            ipcRenderer.send(
                "show-overlay",
                data
            );

        }


    }
);