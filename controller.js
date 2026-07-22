const controls =
require("./controls");



module.exports = function(win){



win.webContents.executeJavaScript(`

(()=>{


let state = "HOME";


let previousButtons = [];

let lastMove = 0;


const MOVE_DELAY = 180;




function send(action){

    window.controllerAPI.sendAction(
        action
    );

}





window.controllerAPI.setState =
function(newState){

    state = newState;

};





function buttonName(id){


switch(id){


case 0:return "A";
case 1:return "B";
case 2:return "X";
case 3:return "Y";

case 4:return "LB";
case 5:return "RB";

case 6:return "LT";
case 7:return "RT";

case 9:return "START";


}


return null;


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



const name =
buttonName(index);



if(name){


const action =
window.controllerAPI.getControl(
state,
name
);



if(action){

send(action);

}


}


}


});




previousButtons =
pad.buttons.map(
b=>b.pressed
);






const now =
Date.now();



if(now-lastMove > MOVE_DELAY){


const x =
pad.axes[0];


const y =
pad.axes[1];



if(x < -0.65){

send("LEFT");

lastMove=now;

}


if(x > 0.65){

send("RIGHT");

lastMove=now;

}


if(y < -0.65){

send("UP");

lastMove=now;

}


if(y > 0.65){

send("DOWN");

lastMove=now;

}


}



}




requestAnimationFrame(
poll
);



}



poll();



})();

`);

};