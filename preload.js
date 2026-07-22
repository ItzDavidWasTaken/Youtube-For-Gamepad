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

        }


    }
);