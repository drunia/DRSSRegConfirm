/**
 * Main script file DRSSRegConfirm
 * Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
 
/**
 * Registering start app point on DRSSRegConfirm.html
 */
document.addEventListener("DOMContentLoaded", main);
 
/**
 * Main start application point
 */
function main() {
	document.querySelector("#mainForm").addEventListener("submit", addToZoTable);
	displayPrintTable();
} 

/**
 * Add new people into printing table
 * Data adds to localStorage
 */
function addToZoTable() {
	var idCode = trim(document.querySelector("#IdInput").value);
	var fio = trim(document.querySelector("#FIOInput").value);
	var printQueueList = localStorage.getItem("printQueueList");
	
	if (!(String(idCode).match(/[0-9]{10}/) || String(idCode).match(/.+\s.+\s.+/))) return;
	printQueueList += idCode + ";" + fio + "|";
	localStorage.setItem("printQueueList", printQueueList);
	return true;
}

/**
 * Delete record from table by icon X
 */
function rmFromZoTable() {

	return false;
}

function displayPrintTable() {
	var zoTable = document.querySelector("#zoTable");
	var printQueueList = localStorage.getItem("printQueueList");
	
	if (printQueueList == null) return;
	var printQueueRows = printQueueList.split("|");
	for (var i = 0; i < printQueueRows.length-1; i++) {
		var tr = document.createElement("tr"); tr.id = "tr_data"
		var td = printQueueRows[i].split(";");
		tr.innerHTML = "<td>" + td[0] + "</td><td> " + td[1] +
			"</td><td><img src=\"delete.png\"></img></td>"
		zoTable.appendChild(tr);
	}
	return true;
}
 
/**
 * Create notification to notificate user 
 */
function notificate(title, message) {
	webkitNotifications.createNotification("icon.png", title, message).show();
}

/**
 * Delete spaces from string
 */
function trim(str) { 
	return String(str).replace(/^\s+|\s+$/g, '');
}