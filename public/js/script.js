//Multiplayer Functions ////////////////////////////////////////////////////////////////////////////////////////////////////////

//server variables
const HOST = "127.0.0.1:3333";
const URL = "http://" + HOST + "/";
let myid = -1;
let myname = "";
let playerCount = 0;

$("#clickable").click(function(event){
    
    //unfocus the game
    unfocus();

    //login button
    if(event.target.id == "input_login"){
        let input = $("#input_text").val();

        //get id from input
        doAjaxCall("GET", "login", { loginName: input }, function(id) {
            //save returned login id
            myid = id;

            //get username from id
            doAjaxCall("GET", "loginname", { id: myid }, function(name) {
                //save returned username and add to title
                myname = name;
                if(myname == "Error"){
                    $("#username").empty()
                    $("#username").append("Please Login"); 
                    $("#form_login")[0].reset();
                }
                else{
                    $("#username").empty()
                    $("#username").append(myname);
                    $("#form_login").empty();
                    
                    //game only starts after login
                    document.addEventListener("keydown",startAction,{ once: true });
                }
            });
        });
    }

    //send chat button
    if(event.target.id == "chat_send"){
        let message = $("#chat_text").val();
        doAjaxCall("GET", "chat", { id: myid, message: message }, function(returned){
        });
        $("#form_chat")[0].reset();
        
    }
});

$(".game").click(function(event){

    //focus back in game
    focus();
});

//initialize socket connection
var socket = io.connect(HOST);
socket.on('players', function (players) { loadStatus(players);});
socket.on('chat', function (message) { displayChatMessage(message);});

//caller for server side ajax calls
function doAjaxCall(method, cmd, params, fcn) {
    $.ajax(
        URL + cmd,
        {
        type: method,
        processData: true,
        data: params,
        dataType: "jsonp",
        success: function (result) {  fcn(result) },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error: " + jqXHR.responseText);
            alert("Error: " + textStatus);
            alert("Error: " + errorThrown);
        }
        }
    );
}

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

//update chat
function displayChatMessage(message){
    $("#chat_box").append(message);
}

//Game Functions ////////////////////////////////////////////////////////////////////////////////////////////////////////

import { updateForest, loopForest } from "./forest.js";
import { updateCapy, setCapy, capyHitBox, capyTripped } from "./capy.js";
import { updateLog, setLog, logHitBox } from "./log.js";

// $(document).one("keydown", startAction);

//forest animation
loopForest()

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
        console.log("Player dead.");
        doAjaxCall("GET", "death", { id: myid, distance: score }, function(returned){
        });
        score = 0;
        lastTime = null;
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