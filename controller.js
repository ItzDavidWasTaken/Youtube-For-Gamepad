module.exports = function(win) {

    console.log("Controller test loaded");

    if (!win) {
        console.log("No window");
        return;
    }


    try {

        const Gamepad =
            require("node-gamepad");

        console.log("node-gamepad loaded");


        const controller =
            new Gamepad("xbox360");


        console.log("controller object created");


        controller.connect();


        console.log("controller connected");


    }
    catch(error) {

        console.log(
            "Controller error:",
            error.message
        );

    }

};