/*
* Log animation and spawner
*/

import { getCustProperty, incrementCustProperty, setCustProperty } from "./update.js";

const gameElem = document.querySelector("[data-game]");
const spawnLogMin = 700;
const spawnLogMax = 2000;
let nextLog;

export function setLog(){
    nextLog = spawnLogMin;
    document.querySelectorAll("[data-log]").forEach(log=>{
        log.remove();
    });
}

function randomNum(min, max){
    return Math.floor(Math.random() * (max-min+1) + min)
}

export function updateLog(delta, speedUp){
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
    log.src = "img/log_blockade.png";
    log.classList.add("log");
    setCustProperty(log,"--left",100);
    gameElem.append(log);
}

export function logHitBox(){
    return[...document.querySelectorAll("[data-log]")].map(log=> {
        return log.getBoundingClientRect()
    });
}

