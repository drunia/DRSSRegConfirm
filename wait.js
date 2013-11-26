/**
 * Wait dialog message
 */
 
var timer = 10;
var waitID = setInterval(displayWait, 1000);
var error = document.createElement("div");
document.body.appendChild(error);


/**
 * Wait function
 */
function displayWait() {
	//\\var error = document.querySelector("#error");
	error.innerHTML = "DRSS Parser: Error ocurred, wait " + timer-- + " seconds...";
	if (timer == 0) {
		clearInterval(waitID);
		location.reload();
	}
}