/*
* Forest background animation
*/

import { getCustProperty, incrementCustProperty, setCustProperty } from "./update.js";
const forestElements = document.querySelectorAll("[data-forest]");

export function loopForest(){
    setCustProperty(forestElements[0], "--left", 0)
    setCustProperty(forestElements[1], "--left", 100)
}

export function updateForest(delta, speedUp){
    forestElements.forEach(forest => {
        incrementCustProperty(forest,"--left", delta * 0.05 * -1 * speedUp);
        if(getCustProperty(forest, "--left") <= -100){
            incrementCustProperty(forest,"--left", 200);
        }
    });

}