module.exports = function(win){


    console.log(
        "Controller started"
    );


    win.webContents.executeJavaScript(`


        (()=>{


            let previous = [];


            function press(action){

                window.controllerAPI.sendAction(
                    action
                );

            }



            function poll(){


                let pads =
                    navigator.getGamepads();


                let pad =
                    pads[0];


                if(pad){


                    pad.buttons.forEach(
                        (button,index)=>{


                            if(
                                button.pressed &&
                                !previous[index]
                            ){


                                switch(index){


                                    case 0:
                                        press("SELECT");
                                        break;


                                    case 1:
                                        press("BACK");
                                        break;


                                    case 9:
                                        press("PLAY");
                                        break;


                                }


                            }


                            previous[index] =
                                button.pressed;


                        }
                    );


                    let x =
                        pad.axes[0];

                    let y =
                        pad.axes[1];


                    if(x < -0.8)
                        press("LEFT");

                    if(x > 0.8)
                        press("RIGHT");

                    if(y < -0.8)
                        press("UP");

                    if(y > 0.8)
                        press("DOWN");


                }


                requestAnimationFrame(
                    poll
                );


            }


            poll();


        })();


    `);

};