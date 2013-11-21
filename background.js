/**
 * Background work script
 * Author: Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
var VER = "Версия: " + chrome.runtime.getManifest().version;
var DRSS_URL = [
	"http://172.1.4.195:7777/ikis/app/f?p=303",
	"http://172.1.4.196:7777/ikis/app/f?p=303"
	];
var WORK_STATUS = { PRINTING: 1, READY: 2, ERROR: 3 };
var MESSAGES = { CLOSE_TAB: 10, UPDATE: 20 };
var parsedTabId = null;

/**
 * Start point
 */
try {
	/**
	 * Initializing READY status
	 */
	chrome.storage.local.set(
		{status: WORK_STATUS.READY},
		function () {
			if (chrome.runtime.lastError != null) {
				alert("Произошла ошибка: \n" + chrome.runtime.lastError);
			}
		}
	);
	
	/**
	 * Set icon status
	 */
	updateStatusIcon();
	
	/**
	 * Registering listener for messages from DRSS parser
	 */
	chrome.runtime.onMessage.addListener(
		function (message, sender, sendResponce) {
			if (message.text == MESSAGES.CLOSE_TAB) {
				chrome.tabs.remove(parsedTabId);
			}
			sendResponce( {text: "OK."} );
		}
	)
	 
} catch (e) {
	alert("Произошла ошибка при инициализации расширения:\n" + e);
	return false;
}

/**
 * Set pringQueueList count to extension icon
 */
function updateStatusIcon() {
	 chrome.storage.local.get(
		function(storage) {
			if (storage.printQueueList != null) {
				var printQueueListCount = storage.printQueueList.split(";").length-1;
				if (printQueueListCount > 0)
					chrome.browserAction.setBadgeText({ text: String(printQueueListCount) });
				else
				  chrome.browserAction.setBadgeText({ text: "" });
			}
		}
	); 
	return true;
}
	 
/**
 * Register chrome.tab [open | close] listeners for DRSS tab
 */
function registerDRSSTabEvents(tabId) {
	parsedTabId = tabId;
	//Fired when tab closed
	chrome.tabs.onRemoved.addListener(
		function (id, removeInfo) {
			if (tabId == id) {
				chrome.storage.local.set({status: WORK_STATUS.READY});
				parsedTabId = null;
			}
		}
	);
	//Fired when tab updated
	chrome.tabs.onUpdated.addListener(
		function (id, updateInfo) {
			if (tabId == id) {
				if (updateInfo.status == "complete") {
					//injecting DRSS parse script into page
					chrome.tabs.executeScript(
						tabId, {file: "DRSSParser.js"}
					);
				}
			}
		}
	);
	return true;
 }