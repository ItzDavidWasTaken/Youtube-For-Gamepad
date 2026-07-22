const {
contextBridge,
ipcRenderer
}=require("electron");



const controls =
require("./controls");



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



sendOverlay:(data)=>{

ipcRenderer.send(
"overlay-update",
data
);

},



getControl:(state,button)=>{


return controls[state]?.[button] || null;


}



});