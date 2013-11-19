/**
 * Main script file DRSSRegConfirm
 * Author: Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */

var background = chrome.extension.getBackgroundPage();
var VER = background.VER;
var DRSS_URL = background.DRSS_URL;
var WORK_STATUS = background.WORK_STATUS;
var zoTable;
var lastProgressState;

/**
 * Init point 
 */
document.addEventListener("DOMContentLoaded", initUI);

/**
 * browserAction load script initiative
 */
function initUI() {
	zoTable = document.querySelector("#zoTable")
	document.querySelector("#addButton").addEventListener("click", addToZoTable);
	document.querySelector("#printButton").addEventListener("click", printAll);
	document.querySelector("#ver").innerHTML = VER;
	//set 1 second update UI timeout
	chrome.storage.local.get(
		function(storage) {
			if (storage.printQueueList == null) {
				chrome.storage.local.set({printQueueList: ""});
				storage.printQueueList = "";
			}
			lastProgressState = storage.printQueueList.length;
			displayPrintTable();
			setInterval(updateUI, 1000);
		}
	);
}

/**
 * Update UI when data (model) changes
 */
function updateUI() {
	chrome.storage.local.get(
		function (storage) {
			var progressState = storage.printQueueList.length;
			if (progressState != lastProgressState) {
				displayPrintTable();
				lastProgressState = progressState;
			}
		}
	);
	return true;
}

/**
 * Add new people into printing table
 * Data adds to localStorage
 */
function addToZoTable() {
	var idCode = document.querySelector("#IdInput").value.trim();
	var fio = document.querySelector("#FIOInput").value.trim();

	chrome.storage.local.get(
		function(storage) {
			var printQueueList = storage.printQueueList;
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
			fio = fio.replace(/\,|\;|\:|\{|\}|\~|\?|\*|\.|\(|\)|\%|\#|\@|\!|\-|\+|\"|\'|\=|\\|\||\/\[|\]/g, "");
			printQueueList += idCode + "," + fio + ";";
			if (printQueueList != printQueueListOld) {
				chrome.storage.local.set({printQueueList: printQueueList});
				document.querySelector("#IdInput").value  = ""
				document.querySelector("#FIOInput").value = "";
				return true;
			}
		}
	);
	return false;
}

/**
 * Delete record from table by icon X
 */
function removeFromZoTable() {
	var deleteRow = this.parentNode.parentNode;
	chrome.storage.local.get(
		function(storage) {
			var printQueueList = storage.printQueueList;
			var delPattern = deleteRow.childNodes[0].childNodes[1].innerHTML + "," +
				deleteRow.childNodes[1].innerHTML + ";";
			var printQueueListOld = printQueueList;
			delPattern = delPattern.trim();
			var regexp = new RegExp(delPattern, "g");
			if (!confirm("Удалить запись по:\n" + delPattern.replace(/\,|\;/g, " ") + "?")) return;
			printQueueList = printQueueList.replace(regexp, "");
			chrome.storage.local.set({printQueueList: printQueueList});
			if (printQueueListOld == printQueueList) return false;
		}
	);
	return true; 
}

/**
 * Display printQueue List
 */
function displayPrintTable() {
	chrome.storage.local.get(
		function (storage) {
			var printQueueList = storage.printQueueList;
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
			else {
				chrome.browserAction.setBadgeText({ text: "" });
				chrome.storage.local.set({status: WORK_STATUS.READY});
			}
			//Add click handlers to removeButton
			var rmButtons = document.querySelectorAll("#removeButton");
			for (var i = 0; i < rmButtons.length; i++) 
				rmButtons[i].onclick = removeFromZoTable;
			//Get status
			var printButton = document.querySelector("#printButton");
			if ((printQueueRows.length - 1) > 0) 
				printButton.setAttribute("style", "display: inline-block");
			else 
				printButton.setAttribute("style", "display: none");
			if (storage.status == WORK_STATUS.PRINTING) {
					printButton.src = "stop.png";
					printButton.title = "Остановить печать";
			} else {
					printButton.src = "print.png";
					printButton.title = "Начать печать";
			}
		}
	);
	return true;
}

/**
 * Printing docs
 */
function printAll() {
	chrome.storage.local.get(
		function (storage) {
			var status = storage.status;
			if (storage.user == null || storage.pass == null || storage.server == null) {
				alert("Настройки не заданы!\nЗайдите в настройки и установите свой логин и пароль ДРСС");
				return false;
			}
			var printButton = document.querySelector("#printButton");
			if (status == null || status != WORK_STATUS.PRINTING) { 
				chrome.storage.local.set({status: WORK_STATUS.PRINTING});
				printButton.src = "stop.png";
				printButton.title = "Остановить печать";
				//Open new tab for work with DRSS
				chrome.tabs.getAllInWindow(function(tabs){
					chrome.tabs.create({
						index: tabs.length + 1,
						url: DRSS_URL[storage.server],
						active: false
						}, 
						function (tab) {
							//Use background for registering close|open tab event
							background.registerDRSSTabEvents(tab.id);
						}
					);
				});
				return true;
			}
			if (status == WORK_STATUS.PRINTING) {
				chrome.storage.local.set({status: WORK_STATUS.READY});
				printButton.src = "print.png";
				printButton.title = "Начать печать";
				//Try close DRSS parse tab, if oppened
				if (background.parsedTabId != null)
					chrome.tabs.remove(background.parsedTabId);
			}
		}
	);
	return true;
}
 
/**
 * Create notification to notificate user 
 */
function notificate(title, message) {
	webkitNotifications.createNotification("icon.png", title, message).show();
}
