// Login & Chat ----------------------------------------------------------


// single player list
let playersList = [];

// login
$("#clickable").click(function(event){
    unfocus();

    // login button
    if(event.target.id == "input_login"){
        let input = $("#input_text").val();
        if(input.length > 1){
            $("#username").empty()
            $("#username").append(input);
            $("#form_login").empty();
            let player = {player: input, dist: 0, death: 0};
            playersList.push(player);
            loadStatus(playersList);

            //game only starts after login
            document.addEventListener("keydown",startAction,{ once: true });
        }
        else{
            $("#username").empty()
            $("#username").append("Username too short"); 
            $("#form_login")[0].reset();
        }
    }

    // logout button
    if(event.target.id == "input_logout"){
        $("#username").empty()
        $("#username").append("Please Login"); 
        $("#form_login")[0].reset();
    }
});

//scoreboard
function loadStatus(players){

    //reset vars to re-update
    let playerHTML = "";
    playerCount = 0;

    //sort players by distance
    for(let i = 0; i < players.length; i++){
        let j = i - 1;
        let temp = players[i];
        while (j >= 0 && players[j].dist < temp.dist) {
            players[j + 1] = players[j];
            j--;
        }
        players[j+1] = temp;
    }

    while(playerCount != players.length){

        //set header
        playerHTML += "<tr><th>Name</th> <th>Distance</th> <th>Deaths</th></tr>"

        //reset score board
        $("#scores").empty();

        //increment player list
        for(let i = 0; i < players.length; i++){
                playerHTML += ("<tr>"+
                    "<td>"+players[i].player+"</td>"+
                    "<td>"+players[i].dist+"</td>"+
                    "<td>"+players[i].death+"</td>"+
                "</tr>");
                playerCount++;
        }
        $("#scores").append(playerHTML);
    }
}

// send chat button
$("#clickable").click(function(event){
    if(event.target.id == "chat_send"){
        let message = $("#chat_text").val();
        $("#form_chat")[0].reset();
        displayChatMessage(message); // singleplayer, no ajax call
    }
});
$("#chat_text").on("keydown", function(event) {
    if (event.keyCode === 13) { // Enter key
        event.preventDefault();
        let message = $("#chat_text").val();
        $("#form_chat")[0].reset();
        displayChatMessage(message);    
    }
});

//update chat - singeplayer, no sockets to ID player
function displayChatMessage(message){
    $("#chat_box").append(playersList[0].player + ": " + message + "<br>");
    document.getElementById("chat_box").scrollTop = document.getElementById("chat_box").scrollHeight;
}

//Game Functions ---------------------------------------------------------------

//forest animation
const forestElements = document.querySelectorAll("[data-forest]");
loopForest()

// focus back in game
$(".game").click(function(event){
    focus();
});

//time-series
let score;
let lastTime;
function update(time){
    if(lastTime == null){
        lastTime = time;
        window.requestAnimationFrame(update);
        return;
    }

    //update stats based on time
    const delta = time - lastTime;
    updateForest(delta,1);
    updateLog(delta,1);
    updateCapy(delta,1);
    updateScore(delta);

    //Checks to see if the log was hit / games ends for player
    if(checkLogHit()){
        return lostGame();
    }

    lastTime = time;
    window.requestAnimationFrame(update);
}

//live score counter
function updateScore(delta){
    score+= delta*0.0025;
    $(".score").text(Math.floor(score));
}

//key to start game
function startAction(e){
    if(e.code !== "Space"){
        return;
    }
    return startGame();
}

//Starts game with 0 score 
function startGame(){
    score = 0;
    lastTime == null;
    loopForest();
    setCapy();
    setLog();
    window.requestAnimationFrame(update);
}

//retrieves hitbox for capy and each log
function checkLogHit(){
    const capyBox = capyHitBox();
    return logHitBox().some(hitBox =>collides(hitBox, capyBox))
}

//check collision between 2 hitboxes
function collides(hitBox1, hitBox2){
    let check1 = false;
    let check2 = false;
    let check3 = false;
    let check4 = false;
    if(hitBox1.left< hitBox2.right){
        check1 = true;
    }
    if(hitBox1.top < hitBox2.bottom){
        check2= true;
    }
    if(hitBox1.right > hitBox2.left){
        check3= true;
    }
    if(hitBox1.bottom > hitBox2.top){
        check4 = true;
    }
    let lost = false;

    if(check1 && check2 && check3 && check4){
        lost = true;
    }
    return lost;
}

//lost game, collided, respawn cooldown
function lostGame(){

    // update scores - singleplayer, no ajax call
    if(score > playersList[0].dist){
        playersList[0].dist = Math.floor(score);
    }
    score = 0;
    playersList[0].death++;
    lastTime = null;
    loadStatus(playersList);
    
    //play capy death animation
    capyTripped();

    //timeout until able to play again (milliseconds)
    setTimeout(()=>{
        // $(document).one("keydown",startGame);
        document.addEventListener("keydown",startAction,{ once: true });
    },1000)
}

function unfocus() {
    document.getElementById("overlay").style.display = "block";
    document.removeEventListener("keydown",startAction);
}

function focus(){
    document.getElementById("overlay").style.display = "none";
    document.addEventListener("keydown",startAction,{ once: true });
}

// update.js --------------------------------------------------------------
function getCustProperty(elem, prop){
    return parseFloat(getComputedStyle(elem).getPropertyValue(prop))
}
function setCustProperty(elem, prop, value){
    elem.style.setProperty(prop, value);
}
function incrementCustProperty(elem, prop, inc){
    setCustProperty(elem, prop, getCustProperty(elem,prop) + inc);
}

// forest.js --------------------------------------------------------------
function loopForest(){
    setCustProperty(forestElements[0], "--left", 0)
    setCustProperty(forestElements[1], "--left", 100)
}

function updateForest(delta, speedUp){
    forestElements.forEach(forest => {
        incrementCustProperty(forest,"--left", delta * 0.05 * -1 * speedUp);
        if(getCustProperty(forest, "--left") <= -100){
            incrementCustProperty(forest,"--left", 200);
        }
    });
}

// capy.js --------------------------------------------------------------
let isJumping;
const jumpSpeed = 0.39;
const jumpGravity = 0.00133;
let yVelocity;
const capyElem = document.querySelector("[data-capy]");

function setCapy(){
    capyElem.src = "./public/img/capy_run.gif"
    isJumping = false;
    yVelocity = 0;
    setCustProperty(capyElem,"--bottom",15);
    document.removeEventListener("keydown",jumpAction);
    document.addEventListener("keydown",jumpAction);
}

function updateCapy(delta, speedUp){
    jump(delta);
}

function jump(delta){
    if(!isJumping){
        return;
    }
    incrementCustProperty(capyElem,"--bottom", yVelocity*delta);
    if(getCustProperty(capyElem,"--bottom") <=15){
        setCustProperty(capyElem,"--bottom", 15);
        isJumping = false;
        capyElem.src = "./public/img/capy_run.gif"
    }
    yVelocity -= jumpGravity * delta;
}

function jumpAction(e){
    if(e.code !== "Space" || isJumping){
        return;
    }
    yVelocity = jumpSpeed;
    isJumping = true;
    capyElem.src = "./public/img/capy_jump.gif"
}

function capyHitBox(){
    return capyElem.getBoundingClientRect();
}

function capyTripped(){
    capyElem.src = "./public/img/capy_dead.gif";
}

// log.js --------------------------------------------------------------
const gameElem = document.querySelector("[data-game]");
const spawnLogMin = 700;
const spawnLogMax = 2000;
let nextLog;

function setLog(){
    nextLog = spawnLogMin;
    document.querySelectorAll("[data-log]").forEach(log=>{
        log.remove();
    });
}

function randomNum(min, max){
    return Math.floor(Math.random() * (max-min+1) + min)
}

function updateLog(delta, speedUp){
    document.querySelectorAll("[data-log]").forEach(log=>{
        incrementCustProperty(log,"--left", delta * speedUp * .05 * -1);
        if(getCustProperty(log,"--left") <= -100){
            log.remove()
        }
    });
    if(nextLog <= 0){
        newLogSpawn();
        nextLog = randomNum(spawnLogMin,spawnLogMax) / speedUp;
    }
    nextLog -= delta;
}

function newLogSpawn(){
    const log = document.createElement("img");
    log.dataset.log = true;
    log.src = "./public/img/log_blockade.png";
    log.classList.add("log");
    setCustProperty(log,"--left",100);
    gameElem.append(log);
}

function logHitBox(){
    return[...document.querySelectorAll("[data-log]")].map(log=> {
        return log.getBoundingClientRect()
    });
}