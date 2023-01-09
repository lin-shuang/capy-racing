/*
* Helper functions to retreive and set css properties for used elements
*/

export function getCustProperty(elem, prop){
    return parseFloat(getComputedStyle(elem).getPropertyValue(prop))
}
export function setCustProperty(elem, prop, value){
    elem.style.setProperty(prop, value);
}
export function incrementCustProperty(elem, prop, inc){
    setCustProperty(elem, prop, getCustProperty(elem,prop) + inc);

}