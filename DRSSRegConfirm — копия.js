/**
 * Main script file DRSSRegConfirm
 * Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */

var VER = "Версия 1.0.0";
var DRSS_URL = "http://vk.com";
var PRINT_QUEUE_LIST = "printQueueList";
var WORK_STATUS = { PRINTING: 1, READY: 2, ERROR: 3 };
var CURRENT_STATUS = "currentStatus";
var zoTable;
var lastProgressState;

//Verify where from script loaded
if (String(document.location).match(/chrome-extension.+DRSSRegConfirm\.html/) != null) {
	//Script loaded from browserAction icon click
	document.addEventListener("DOMContentLoaded", initUI);
	chrome.storage.local.set( {message: "hello"}, function(){} );
} else {
	//Script loaded from DRSS work page
	workOnDRSS();
} 

/** 
 * Main method to working with DRSS
 */
function workOnDRSS() {
	console.log("DRSSRegConfirm " + VER + " started.");
	chrome.storage.local.get( "message" , function(values) {alert(values.message);});
	return;
	alert(localStorage.getItem(PRINT_QUEUE_LIST).length);
	chrome.tabs.getCurrent(
		function (tab) {
			chrome.tabs.onRemoved(
				function (tabId) {
					if (tab.id == tabId) {
						alert("Нашу вкладку закрывают ((");
					}
				}
			);
		}
	);
}
 
/**
 * browserAction load script initiative
 */
function initUI() {
	zoTable = document.querySelector("#zoTable")
	document.querySelector("#addButton").addEventListener("click", addToZoTable);
	document.querySelector("#printButton").addEventListener("click", printAll);
	document.querySelector("#ver").innerHTML = VER;
	//set 1 second update UI timeout
	lastProgressState = localStorage.getItem(PRINT_QUEUE_LIST).length;
	displayPrintTable();
	setInterval(updateUI, 1000);
}

/**
 * Update UI when data (model) changes
 */
function updateUI() {
	var progressState = localStorage.getItem(PRINT_QUEUE_LIST).length;
	if (progressState != lastProgressState) {
		displayPrintTable();
		lastProgressState = progressState;
	}
	return true;
}

/**
 * Add new people into printing table
 * Data adds to localStorage
 */
function addToZoTable() {
	var idCode = document.querySelector("#IdInput").value.trim();
	var fio = document.querySelector("#FIOInput").value.trim();
	var printQueueList = localStorage.getItem(PRINT_QUEUE_LIST);
	var printQueueListOld = printQueueList;
	if (printQueueList == null) printQueueList = "";
	if (!(String(idCode).match(/[0-9]{10}/) &&
		  String(fio).match(/.+\s.+\s.+/))) {
		alert("Одно из полей заполнено не верно!\n\n" + 
			"Ид. код: XXXXXXXXXX - где Х цифра от 0-9\n" +
			"Ф.И.О.: X X X - где Х любое множество символов.");
		return false;
	}
	//Check if zo already exists
	if (printQueueList != "" && printQueueList.match(idCode, "g")) {
		alert("Запись по:\n" + idCode + " " + fio + " уже существует!");
		return false;
	}
	fio = fio.replace(/\,|\;|\:|\{|\}|\~|\?|\*|\.|\(|\)|\%|\#|\@|\!|\-|\+|\"|\'|\=|\\|\||\//g, "");
	printQueueList += idCode + "," + fio + ";";
	if (printQueueList != printQueueListOld) {
		localStorage.setItem(PRINT_QUEUE_LIST, printQueueList)
		document.querySelector("#IdInput").value  = ""
		document.querySelector("#FIOInput").value = "";
		return true;
	}
	return false;
}

/**
 * Delete record from table by icon X
 */
function removeFromZoTable() {
	var deleteRow = this.parentNode.parentNode;
	var printQueueList = localStorage.getItem(PRINT_QUEUE_LIST);
	var delPattern = deleteRow.childNodes[0].childNodes[1].innerHTML + "," +
		deleteRow.childNodes[1].innerHTML + ";";
	var printQueueListOld = printQueueList;
	delPattern = delPattern.trim();
	var regexp = new RegExp(delPattern, "g");
	if (!confirm("Удалить запись по:\n" + delPattern.replace(/\,|\;/g, " ") + "?")) return;
	printQueueList = printQueueList.replace(regexp, "");
	localStorage.setItem(PRINT_QUEUE_LIST, printQueueList);
	if (printQueueListOld == printQueueList) return false;
	return true; 
}

/**
 * Display printQueue List
 */
function displayPrintTable() {
	var printQueueList = localStorage.getItem(PRINT_QUEUE_LIST);
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
	//Get status
	var printButton = document.querySelector("#printButton");
	var status = localStorage.getItem(CURRENT_STATUS);
	if (status == WORK_STATUS.PRINTING) {
		printButton.src = "stop.png";
		printButton.title = "Остановить печать";
	} else {
		printButton.src = "print.png";
		printButton.title = "Начать печать";
	}
	return true;
}

/**
 * Printing docs
 */
function printAll() {
	var status = localStorage.getItem(CURRENT_STATUS);
	var printButton = document.querySelector("#printButton");
	if (status == null || status != WORK_STATUS.PRINTING) { 
		localStorage.setItem(CURRENT_STATUS, WORK_STATUS.PRINTING);
		printButton.src = "stop.png";
		printButton.title = "Остановить печать";
		//Open new tab for work with DRSS
		chrome.tabs.getAllInWindow(function(tabs){
			chrome.tabs.create({ index: tabs.length + 1, url: DRSS_URL, active: false});
		});
		return true;
	}
	if (status == WORK_STATUS.PRINTING) {
		localStorage.setItem(CURRENT_STATUS, WORK_STATUS.READY);
		printButton.src = "print.png";
		printButton.title = "Начать печать";
	}
	return true;
}
 
/**
 * Create notification to notificate user 
 */
function notificate(title, message) {
	webkitNotifications.createNotification("icon.png", title, message).show();
}
