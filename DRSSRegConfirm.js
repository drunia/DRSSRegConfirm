/**
 * Main script file DRSSRegConfirm
 * Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
 
/**
 * Registering start app point on DRSSRegConfirm.html
 */
document.addEventListener("DOMContentLoaded", main);
var zoTable;
 
/**
 * Main start application point
 */
function main() {
	zoTable = document.querySelector("#zoTable")
	document.querySelector("#addButton").addEventListener("click", addToZoTable);
	displayPrintTable();
} 

/**
 * Add new people into printing table
 * Data adds to localStorage
 */
function addToZoTable() {
	var idCode = document.querySelector("#IdInput").value.trim();
	var fio = document.querySelector("#FIOInput").value.trim();
	var printQueueList = localStorage.getItem("printQueueList");
	if (!(String(idCode).match(/[0-9]{10}/) &&
		  String(fio).match(/.+\s.+\s.+/))) {
		alert("Одно из полей заполнено не верно!\n\n" + 
			"Ид. код: XXXXXXXXXX - где Х цифра от 0-9\n" +
			"Ф.И.О.: X X X - где Х любое множество символов.");
		return false;
	}
	fio = fio.replace(/\,|\;/g, "");
	printQueueList += idCode + "," + fio + ";";
	localStorage.setItem("printQueueList", printQueueList);
	return displayPrintTable();
}

/**
 * Delete record from table by icon X
 */
function removeFromZoTable() {
	var deleteRow = this.parentNode.parentNode;
	var printQueueList = localStorage.getItem("printQueueList");
	var delPattern = deleteRow.childNodes[0].innerHTML + "," +
		deleteRow.childNodes[1].innerHTML + ";";
	var regexp = new RegExp(delPattern, "g");
	if (!confirm("Удалить запись по:\n" + delPattern.replace(/\,|\;/g, " ") + "?")) return;
	printQueueList = printQueueList.replace(regexp, "");
	localStorage.setItem("printQueueList", printQueueList);
	return zoTable.removeChild(deleteRow);
}

/**
 * Display prontQueue List
 */
function displayPrintTable() {
	var printQueueList = localStorage.getItem("printQueueList");
	var zoTableRows = document.querySelectorAll("#tr_data");
	//Clear zoTable
	for(var i = 0; i < zoTableRows.length; i++) 
		zoTable.removeChild(zoTableRows[i]);
	if (printQueueList == null) return;
	var printQueueRows = printQueueList.split(";");
	for (var i = 0; i < printQueueRows.length-1; i++) {
		var tr = document.createElement("tr");
		tr.id = "tr_data";
		var td = printQueueRows[i].split(",");
		tr.innerHTML = "<td style='border: 1px solid #DCDCDC;'>" + td[0] +
			"</td><td style='border: 1px solid #DCDCDC;'>" + td[1] +
			"</td><td><input type=\"image\" src=\"delete.png\" id=\"removeButton\" value=\"Удалить\"></td>";
		zoTable.appendChild(tr);
	}
	//Add click handlers to removeButton
	var rmButtons = document.querySelectorAll("#removeButton");
	for (var i = 0; i < rmButtons.length; i++) 
		rmButtons[i].onclick = removeFromZoTable;
	return true;
}
 
/**
 * Create notification to notificate user 
 */
function notificate(title, message) {
	webkitNotifications.createNotification("icon.png", title, message).show();
}
