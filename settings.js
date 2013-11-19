/**
 * Setings script file of DRSSRegConfirm
 * Author: Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
var backgrounnd = chrome.extension.getBackgroundPage();
var VER = backgrounnd.VER;
var server, user, pass, boss, number, region, operator;

/**
 * Init setting
 */
try {
	document.querySelector("#ver").innerHTML = VER;
	server = document.querySelector("#server");
	user = document.querySelector("#user");
	pass = document.querySelector("#pass");
	number = document.querySelector("#number");
	region = document.querySelector("#region");
	boss = document.querySelector("#boss");
	operator = document.querySelector("#operator");
	chrome.storage.local.get(
		function (storage) {
			if (storage.server != null) server.selectedIndex = storage.server;
			if (storage.user != null) user.value = storage.user;
			if (storage.pass != null) pass.value = storage.pass;
			if (storage.boss != null) boss.value = storage.boss;
			if (storage.region != null) region.value = storage.region;
			if (storage.number != null) number.value = storage.number;
			if (storage.operator != null) operator.value = storage.operator;
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
		server: server.selectedIndex,
		boss: boss.value,
		number: number.value,
		user: user.value,
		pass: pass.value,
		region: region.value,
		operator: operator.value
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
