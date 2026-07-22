module.exports = function(win){

    console.log("Controller started");


    win.webContents.executeJavaScript(`

    (()=>{


        let previousButtons = [];

        let lastMove = 0;

        const MOVE_DELAY = 180;


        function press(action){

            window.controllerAPI.sendAction(action);

        }



        function buttonPressed(index){

            const pads =
                navigator.getGamepads();


            const pad =
                pads[0];


            if(!pad)
                return false;


            return pad.buttons[index]?.pressed;

        }



        function handleButton(index, action){


            if(
                buttonPressed(index) &&
                !previousButtons[index]
            ){

                press(action);

            }


        }



        function handleStick(){


            const pads =
                navigator.getGamepads();


            const pad =
                pads[0];


            if(!pad)
                return;


            const now =
                Date.now();


            if(
                now - lastMove < MOVE_DELAY
            )
                return;



            const DEADZONE = 0.65;


            let x =
                pad.axes[0];


            let y =
                pad.axes[1];



            if(Math.abs(x) > DEADZONE){


                lastMove = now;


                if(x < 0)
                    press("LEFT");
                else
                    press("RIGHT");


                return;

            }



            if(Math.abs(y) > DEADZONE){


                lastMove = now;


                if(y < 0)
                    press("UP");
                else
                    press("DOWN");


            }


        }





        function poll(){


            const pads =
                navigator.getGamepads();


            const pad =
                pads[0];



            if(pad){



                // A
                handleButton(
                    0,
                    "SELECT"
                );


                // B
                handleButton(
                    1,
                    "BACK"
                );


                // Start
                handleButton(
                    9,
                    "PLAY"
                );



                // D-pad
                handleButton(
                    12,
                    "UP"
                );


                handleButton(
                    13,
                    "DOWN"
                );


                handleButton(
                    14,
                    "LEFT"
                );


                handleButton(
                    15,
                    "RIGHT"
                );



                previousButtons =
                    pad.buttons.map(
                        b=>b.pressed
                    );



                handleStick();


            }



            requestAnimationFrame(
                poll
            );


        }



        poll();



    })();


    `);

};