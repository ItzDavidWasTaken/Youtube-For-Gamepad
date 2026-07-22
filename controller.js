module.exports = function(win) {


    if (!win) {

        console.log(
            "No window supplied to controller"
        );

        return;

    }


    try {


        const Gamepad =
            require("node-gamepad");


        console.log(
            "Controller module loaded"
        );


        const controller =
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


            setTimeout(() => {


                win.webContents.sendInputEvent({

                    type: "keyUp",
                    keyCode: key

                });


            }, 50);


        }



        controller.on(
            "down",
            button => {


                console.log(
                    "Button:",
                    button
                );


                switch(button) {


                    case "A":
                        sendKey("ENTER");
                        break;


                    case "B":
                        sendKey("ESC");
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
    catch(error) {


        console.log(
            "Controller disabled:",
            error.message
        );


        // Do nothing.
        // App continues without controller.

    }

};