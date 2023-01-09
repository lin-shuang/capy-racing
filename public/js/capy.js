/*
* Capy animation and utility methods
*/

import { incrementCustProperty, getCustProperty, setCustProperty } from "./update.js";

let isJumping;
const jumpSpeed = 0.39;
const jumpGravity = 0.0015;
let yVelocity;
const capyElem = document.querySelector("[data-capy]");

export function setCapy(){
    capyElem.src = "img/capy_run.gif"
    isJumping = false;
    yVelocity = 0;
    setCustProperty(capyElem,"--bottom",15);
    document.removeEventListener("keydown",jumpAction);
    document.addEventListener("keydown",jumpAction);
}

export function updateCapy(delta, speedUp){
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
    }
    yVelocity -= jumpGravity * delta;
}

function jumpAction(e){
    if(e.code !== "Space" || isJumping){
        return;
    }
    yVelocity = jumpSpeed;
    isJumping = true;
}

export function capyHitBox(){
    return capyElem.getBoundingClientRect();
}

export function capyTripped(){
    capyElem.src = "img/capy_dead.gif";
}