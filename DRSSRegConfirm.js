/**
 * Main script file DRSSRegConfirm
 * Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
var zoTable;
var version = "Версия 1.0.0";
var workURL = "http://vk.com";

//Verify where from script loaded
if (String(document.location).match(/chrome-extension.+DRSSRegConfirm\.html/) != null) {
	//Script loaded from browserAction icon click
	document.addEventListener("DOMContentLoaded", initUI);
} else {
	//Script loaded from DRSS work page
	alert("! :" + document.location);
} 
 
/**
 * browserAction load script initiative
 */
function initUI() {
	zoTable = document.querySelector("#zoTable")
	document.querySelector("#addButton").addEventListener("click", addToZoTable);
	document.querySelector("#printButton").addEventListener("click", printAll);
	document.querySelector("#ver").innerHTML = version;
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
	//Check if zo already exists
	if (printQueueList.match(idCode, "g")) {
		alert("Запись по:\n" + idCode + " " + fio + " уже существует!");
		return false;
	}
	fio = fio.replace(/\,|\;|\:|\{|\}|\~|\?|\*|\.|\(|\)|\%|\#|\@|\!|\-|\+|\"|\'|\=|\\|\||\//g, "");
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
	var delPattern = deleteRow.childNodes[0].childNodes[1].innerHTML + "," +
		deleteRow.childNodes[1].innerHTML + ";";
	var printQueueListOld = printQueueList;
	delPattern = delPattern.trim();
	var regexp = new RegExp(delPattern, "g");
	if (!confirm("Удалить запись по:\n" + delPattern.replace(/\,|\;/g, " ") + "?")) return;
	printQueueList = printQueueList.replace(regexp, "");
	localStorage.setItem("printQueueList", printQueueList);
	if (printQueueListOld != printQueueList) return displayPrintTable();
	return false; 
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
	for (var i = 0; i < printQueueRows.length - 1; i++) {
		var tr = document.createElement("tr");
		tr.id = "tr_data";
		var td = printQueueRows[i].split(",");
		tr.innerHTML = "<td style='border: 1px solid #DCDCDC; border-radius: 5px;'>" + 
			"<img src=\"user.png\"><span> " + td[0] +"</span></td>" +
			"<td style='border: 1px solid #DCDCDC; border-radius: 5px;'>" + td[1] +
			"</td><td align=\"center\"><input type=\"image\" " + 
			"src=\"trash.png\" id=\"removeButton\" title=\"Удалить\"></td>";
		zoTable.appendChild(tr);
	}
	if (printQueueRows.length > 1) 
		chrome.browserAction.setBadgeText({ text: String(printQueueRows.length - 1) });
	else 
		chrome.browserAction.setBadgeText({ text: "" });
	//Add click handlers to removeButton
	var rmButtons = document.querySelectorAll("#removeButton");
	for (var i = 0; i < rmButtons.length; i++) 
		rmButtons[i].onclick = removeFromZoTable;
	return true;
}

/**
 * Printing docs
 */
function printAll() {
	var printQueueList = localStorage.getItem("printQueueList").split(";");
	chrome.tabs.getAllInWindow(function(tabs){
		for (var i = 0; i < printQueueList.length - 1; i++) {
			chrome.tabs.create({ index: tabs.length + 1, url: workURL, active: false, pinned : true});
		}	
	});
}
 
/**
 * Create notification to notificate user 
 */
function notificate(title, message) {
	webkitNotifications.createNotification("icon.png", title, message).show();
}
