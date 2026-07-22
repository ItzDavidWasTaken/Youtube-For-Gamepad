const controls = require("./controls");


module.exports = function(win){


win.webContents.executeJavaScript(`

(()=>{


let currentState = "HOME";


let previousButtons = [];



function send(action){

    window.controllerAPI.sendAction(action);

}



function getAction(button){

    const profiles = {

        HOME:{
            0:"SELECT",
            1:"BACK",
            3:"SEARCH",
            9:"MENU"
        },


        VIDEO:{
            0:"SELECT",
            1:"BACK",
            3:"HIDE_CONTROLS",
            6:"VOLUME_DOWN",
            7:"VOLUME_UP",
            4:"SKIP_BACK",
            5:"SKIP_FORWARD",
            9:"PAUSE"
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
navigator.getGamepads();


const pad =
pads[0];



if(pad){


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



}


requestAnimationFrame(
poll
);


}



poll();



})();

`);

};