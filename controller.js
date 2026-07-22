let controller;


module.exports = function(win) {


    console.log("Starting controller...");


    try {


        const Gamepad =
            require("node-gamepad");


        controller =
            new Gamepad("xbox360");


        controller.connect();


        console.log(
            "Controller connected"
        );


        function sendKey(key) {


            win.webContents.sendInputEvent({

                type: "keyDown",
                keyCode: key

            });


            setTimeout(()=>{


                win.webContents.sendInputEvent({

                    type:"keyUp",
                    keyCode:key

                });


            },50);


        }



        controller.on(
            "down",
            button => {


                console.log(
                    "Pressed:",
                    button
                );


                switch(button){


                    case "A":
                        sendKey("ENTER");
                        break;


                    case "B":
                        sendKey("ESC");
                        break;


                    case "X":
                        sendKey("S");
                        break;


                    case "Y":
                        sendKey("HOME");
                        break;


                    case "START":
                        sendKey("SPACE");
                        break;


                    case "UP":
                        sendKey("UP");
                        break;


                    case "DOWN":
                        sendKey("DOWN");
                        break;


                    case "LEFT":
                        sendKey("LEFT");
                        break;


                    case "RIGHT":
                        sendKey("RIGHT");
                        break;

                }


            }
        );


    }
    catch(error){


        console.error(
            "Controller failed:",
            error
        );


    }


};