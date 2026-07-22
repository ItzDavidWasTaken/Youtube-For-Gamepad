module.exports = function(win){


win.webContents.executeJavaScript(`

(()=>{


let currentState = "HOME";
let controllerConnected = false;


let previousButtons = [];
let previousAxes = [0, 0];
let lastAxisActionTime = 0;



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
            12:"UP",
            13:"DOWN",
            14:"LEFT",
            15:"RIGHT"
        },


        VIDEO:{
            0:"SELECT",
            1:"BACK",
            4:"SKIP_BACK",
            5:"SKIP_FORWARD",
            9:"PAUSE",
            12:"UP",
            13:"DOWN",
            14:"LEFT",
            15:"RIGHT"
        },


        SEARCH:{
            0:"SELECT",
            1:"BACK"
        }

    };


    return profiles[currentState]?.[button];

}



function handleAxes(pad){

    const now = Date.now();
    const axisX = pad.axes[0] || 0;
    const axisY = pad.axes[1] || 0;
    const deadZone = 0.5;
    const repeatDelay = 180;
    let action = null;


    if(Math.abs(axisX) >= deadZone){

        action = axisX < 0 ? "LEFT" : "RIGHT";

    }else if(Math.abs(axisY) >= deadZone){

        action = axisY < 0 ? "UP" : "DOWN";

    }


    if(
        action &&
        (
            Math.abs(previousAxes[0]) < deadZone && Math.abs(previousAxes[1]) < deadZone ||
            now - lastAxisActionTime >= repeatDelay
        )
    ){

        send(action);
        lastAxisActionTime=now;

    }


    previousAxes=[axisX,axisY];

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
handleAxes(pad);


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
            previousAxes=[0,0];
    lastAxisActionTime=0;
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