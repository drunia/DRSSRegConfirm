/**
 * Setings script file of DRSSRegConfirm
 * Author: Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
var backgrounnd = chrome.extension.getBackgroundPage();
var VER = backgrounnd.VER;
var user, pass;

/**
 * Init setting
 */
try {
	document.querySelector("#ver").innerHTML = VER;
	user = document.querySelector("#user");
	pass = document.querySelector("#pass");
	chrome.storage.local.get(
		function (storage) {
			if (storage.user != null) user.value = storage.user;
			if (storage.pass != null) pass.value = storage.pass;
		}
	);
	//add listener to save button
	document.querySelector("#saveButton").addEventListener("click", saveListener);
} catch (e) {
	alert("Произошла ошибка в инициализации Настроек:\n" + e);
}

/**
 * Write settins
 */
function saveListener() {
	var settings = {
		user : user.value,
		pass : pass.value
	};
	chrome.storage.local.set(settings,
		function () {
			if (chrome.runtime.lastError == null) {
				alert("Настройки записаны успешно.");
			}
		}
	);
	return true;
}
