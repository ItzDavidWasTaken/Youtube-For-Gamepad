let currentState = "HOME";


function detectState(){


    const video =
        document.querySelector("video");



    if(video){


        const playing =
            !video.paused &&
            video.currentTime > 0 &&
            !video.ended;



        if(playing){

            return "VIDEO";

        }

    }



    const input =
        document.querySelector(
            "input"
        );



    if(input){

        return "SEARCH";

    }



    return "HOME";

}




function startStateWatcher(callback){


    setInterval(()=>{


        const newState =
            detectState();



        if(newState !== currentState){


            currentState =
                newState;


            callback(
                currentState
            );


        }


    },1000);


}



module.exports = {

    startStateWatcher

};