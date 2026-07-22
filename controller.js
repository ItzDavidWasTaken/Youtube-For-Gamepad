module.exports = function(win){


    win.webContents.executeJavaScript(`

    (()=>{


        let previousButtons = [];

        let lastMove = 0;

        let hadController = false;


        const MOVE_DELAY = 180;



        function send(action){

            window.controllerAPI.sendAction(
                action
            );

        }



        function poll(){


            const pads =
                navigator.getGamepads();


            const pad =
                pads[0];



            const connected =
                pad !== null;



            if(
                connected &&
                !hadController
            ){

                window.controllerAPI.sendStatus(
                    "connected"
                );

            }



            if(
                !connected &&
                hadController
            ){

                window.controllerAPI.sendStatus(
                    "disconnected"
                );

            }



            hadController =
                connected;



            if(pad){



                pad.buttons.forEach(
                    (button,index)=>{


                        if(
                            button.pressed &&
                            !previousButtons[index]
                        ){


                            switch(index){


                                case 0:
                                    send("SELECT");
                                    break;


                                case 1:
                                    send("BACK");
                                    break;


                                case 9:
                                    send("PLAY");
                                    break;


                                case 12:
                                    send("UP");
                                    break;


                                case 13:
                                    send("DOWN");
                                    break;


                                case 14:
                                    send("LEFT");
                                    break;


                                case 15:
                                    send("RIGHT");
                                    break;


                            }

                        }


                    }
                );



                previousButtons =
                    pad.buttons.map(
                        b=>b.pressed
                    );




                const now =
                    Date.now();


                if(
                    now-lastMove >
                    MOVE_DELAY
                ){


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