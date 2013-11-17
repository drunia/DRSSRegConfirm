/**
 * Setings script file of DRSSRegConfirm
 * Author: Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
 
var VER = "Версия 1.0.0";
 
/**
 * Run script by DOMContentLoaded event
 */
document.addEventListener("DOMContentLoaded", init);
 
/**
 * Init function, called when DOMContentLoaded event fired
 */
function init() {
	document.querySelector("#ver").innerHTML = VER;
}