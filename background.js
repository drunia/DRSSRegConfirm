/**
 * Background work script
 * Author: Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
var VER = "Версия: " + chrome.runtime.getManifest().version;
var DRSS_URL = [
	"http://172.1.4.195:7777/ikis/app/f?p=303",
	"http://173.1.4.196:7777/ikis/app/f?p=303"
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
			//CLOSE_TAB MESSAGE
			if (message.text == MESSAGES.CLOSE_TAB) {
				chrome.tabs.remove(parsedTabId);
			}
			//UPDATE MESSAGE
			if (message.text == MESSAGES.UPDATE) {
				updateStatusIcon();
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
		function (id, updateInfo, tab) {
		try{
			if (tabId == id && updateInfo.status == "complete") {
				if (tab.title.match(/К сожалению.*/)) {
					//show notify error load url to user
					var notifyID = "WAIT_NOTIFY";
					var timer = 10;
					var options = {
						type:  "basic",
						title: "Опаньки, приплыли ...",
						iconUrl: "icon.png",
						message: "Похоже, что ДРСС сейчас не доступен :(\n\n" +
							"Не закрывайте вкладку, а я попробую перезагрузить ее через " + timer + " секунд..."
					}
					var notifyCallback = function () {}
					var reloadTabFunc = function () {
						options.message = "Похоже, что ДРСС сейчас не доступен :(\n\n" +
							  "Не закрывайте вкладку, а я попробую перезагрузить ее через " + timer-- + " секунд...";
						chrome.notifications.update(notifyID, options,  notifyCallback);
						if (timer == 0) {
							clearInterval(intervalID);
							chrome.notifications.clear(notifyID, notifyCallback);
							chrome.tabs.reload(tabId);
						}
					}
					chrome.notifications.create(notifyID, options, notifyCallback);
					var intervalID = setInterval(reloadTabFunc, 1000);
				}
				else
					//injecting DRSS parse script into page
					chrome.tabs.executeScript(
						tabId, {file: "DRSSParser.js"}
					);
			}
			
			} catch (e) {alert(e)}
		}
	);
	return true;
 }