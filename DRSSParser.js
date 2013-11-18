/**
 * DRSS parser script
 * Author: Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
var WORK_STATUS = { PRINTING: 1, READY: 2, ERROR: 3 };


/**
 * Check parse needed
 */
chrome.storage.local.get(
	function (storage) {
		if (storage.status != null && storage.status == WORK_STATUS.PRINTING) {		
		
		} else console.log("DRSS parser: DRSSRegConfirm not working now, sleep..."); 
	}
);


/** 
 * Main method to working with DRSS
 */
function workOnDRSS() {
	console.log("DRSSRegConfirm " + VER + " started.");
	chrome.storage.local.get(
		function (storage) {
			var printQueueList = storage.printQueueList;
			var status = storage.status;
			console.log("Requests in queue: " + (printQueueList.split(";").length - 1));
			console.log("Status: " + ["UFO", "PRINTING", "READY", "ERROR"][status]);
			
			DRSSLogin() ;
		}
	);
}

/**
 * Login to DRSS 
 */
function DRSSLogin() {
	var login = document.querySelector("#P111_USERNAME");
	var passw = document.querySelector("#P111_PASSWORD");
	var loginButton = document.querySelector('a.t20Button');
	
	login.value = "u20045-drunia";
	passw.value = "pass1032";
	loginButton.click();
}
 