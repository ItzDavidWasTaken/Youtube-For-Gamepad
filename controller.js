const Gamepad = require("node-gamepad");


module.exports = function(window){


    console.log(
        "Starting controller system"
    );


    const controller =
        new Gamepad("xbox360");


    controller.connect();


    function sendKey(key){


        window.webContents.sendInputEvent({

            type:"keyDown",
            keyCode:key

        });


        setTimeout(()=>{

            window.webContents.sendInputEvent({

                type:"keyUp",
                keyCode:key

            });

        },50);

    }



    controller.on(
        "down",
        function(button){

            console.log(
                "Button:",
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


                case "START":
                    sendKey("SPACE");
                    break;

            }

        }
    );

};