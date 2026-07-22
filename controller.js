module.exports = function(win){


win.webContents.executeJavaScript(`

(()=>{


let currentState = "HOME";
let controllerConnected = false;


let previousButtons = [];



function send(action){

    window.controllerAPI?.sendAction(action);

}



function setState(state){

    if(state === currentState){

        return;

    }


    currentState = state;
    window.controllerAPI?.sendOverlay({state});

}



function detectState(){

    const activeElement = document.activeElement;


    if(
        activeElement &&
        (
            activeElement.matches?.("input, textarea") ||
            activeElement.isContentEditable
        )
    ){

        return "SEARCH";

    }


    const video = document.querySelector("video");


    if(video && !video.ended && video.currentTime > 0){

        return "VIDEO";

    }


    return "HOME";

}



function getAction(button){

    const profiles = {

        HOME:{
            0:"SELECT",
            1:"BACK",
            3:"SEARCH",
            9:"MENU",
            12:"UP",
            13:"DOWN",
            14:"LEFT",
            15:"RIGHT"
        },


        VIDEO:{
            0:"SELECT",
            1:"BACK",
            3:"HIDE_CONTROLS",
            6:"VOLUME_DOWN",
            7:"VOLUME_UP",
            4:"SKIP_BACK",
            5:"SKIP_FORWARD",
            9:"PAUSE",
            12:"UP",
            13:"DOWN",
            14:"LEFT",
            15:"RIGHT"
        },


        SEARCH:{
            0:"CONFIRM",
            1:"CLOSE",
            2:"BACKSPACE",
            3:"CLEAR"
        }

    };


    return profiles[currentState]?.[button];

}




function poll(){


const pads =
navigator.getGamepads?.() || [];


const pad =
pads.find(
    candidate=>candidate && candidate.connected
);



if(pad){

if(!controllerConnected){

    controllerConnected=true;
    window.controllerAPI?.sendStatus("connected");
    window.controllerAPI?.sendOverlay({state:currentState});

}


setState(detectState());


pad.buttons.forEach(
(button,index)=>{


if(
button.pressed &&
!previousButtons[index]
){


const action =
getAction(index);



if(action){

send(action);

}


}


});



previousButtons =
pad.buttons.map(
b=>b.pressed
);


}else if(controllerConnected){

    controllerConnected=false;
    previousButtons=[];
    window.controllerAPI?.sendStatus("disconnected");


}


requestAnimationFrame(
poll
);


}



poll();



})();

`);

};