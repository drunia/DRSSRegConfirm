/**
 * DRSS parser script
 * Author: Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */

var WORK_STATUS = { PRINTING: 1, READY: 2, ERROR: 3 };
var MESSAGES = { CLOSE_TAB: 10, UPDATE: 20 };
var DRSS_URL = [
	"http://172.1.4.195:7777/ikis/app/f?p=303",
	"http://172.1.4.196:7777/ikis/app/f?p=303"
	];
var currInQueue = null;
var AdditionalInfo = {from: null, to: null};
var regInfo = { id: null, fio: null, register: null, regFromTo: null };

//locations by apex variable p_flow_step_id//
var LOGIN_PAGE = 111;
var MAIN_MENU  = 1000;
var FIND_PAGE  = 1;
var REG_COMMON_TAB = 120;
var REG_ADDIT_TAB  = 126;
var REG_MDZU_TAB   = 138;
//////////////////////////////////////////////

/**
 * Parser start her
 */
 try {
	chrome.storage.local.get(
		function (storage) {
			if (storage.status != null && storage.status == WORK_STATUS.PRINTING) {		
				user = storage.user;
				pass = storage.pass;
				if (storage.printQueueList.split(";").length-1 == 0) {
					console.log("DRSS parser: Nothing DRSSPrinted!");
					return false;
				} else { 
					currInQueue = storage.printQueueList.split(";")[0];
					console.log("DRSS parser: Processed record in queue = \"" + currInQueue + "\"");
				}
				console.log("DRSS parser: Starting parse DRSS..."); 
				var stepId = document.getElementsByName("p_flow_step_id");
				if (stepId == null) {
					console.log("DRSS parser: Unknown location (p_flow_step_id == null), STOP parse!");
					return false;
				} else stepId = stepId[0].value;
				//Analize locations
				switch (parseInt(stepId)) {
					//p_flow_step_id = 111 - Login page
					case LOGIN_PAGE:
						console.log("DRSS parser: Location: login page, try login...");
						DRSSLogin(storage);
					break;
					//p_flow_step_id = 1000 - Mainmenu page
					case MAIN_MENU:
						console.log("DRSS parser: Location Mainmenu page, try open find page...");
						DRSSOpenFindPage(storage);
					break;		
					//p_flow_step_id = 1 - Find page
					case FIND_PAGE:
						console.log("DRSS parser: Location DRSS Find page, try query by people...");
						var regInfo = DRSSQueryDataByPeople(storage);
						if (regInfo != null) {
							DRSSPrint(regInfo, storage);
							DRSSCommit(storage);
						}
					break;
					//p_flow_step_id = 120 - Advanced registration info page
					case REG_COMMON_TAB:
						console.log("DRSS parser: Location DRSS advanced registration info page, parse...");
						DRSSEnterToMDZU();
					break;
					//p_flow_step_id = 126 - Additional registration info page
					case REG_ADDIT_TAB:
						console.log("DRSS parser: Location DRSS advanced registration info page [Додатково], parse...");
						AdditionalInfo.to = document.querySelector("#P126_IAB_STOP_DT").value;
						var regInfo = { id: null, fio: null, register: null, regFromTo: null };
						regInfo.id  = currInQueue.split(",")[0];
						regInfo.fio = currInQueue.split(",")[1];
						regInfo.register = !(AdditionalInfo.from.trim() == "");
						regInfo.regFromTo = AdditionalInfo.from  + ";" + AdditionalInfo.to;
						//try print data
						DRSSPrint(regInfo, storage);
						DRSSCommit(storage);
					break;
					//p_flow_step_id = 138 - Advanced registration info page [Дані МДЗУ]
					case REG_MDZU_TAB:
						console.log("DRSS parser: Location DRSS advanced registration info page [Дані МДЗУ], parse...");
						var regInfo = DRSSParseRegData();
						if (regInfo != null) {
							DRSSPrint(regInfo, storage);
							DRSSCommit(storage);
						}
					break;
					default: 
						console.log("DRSS parser: Unknown location (p_flow_step_id = " + stepId + "), STOP parse!");
						return false;
					break;
				}
			} else console.log("DRSS parser ERROR: Extension DRSSRegConfirm not in status PRINTING..."); 
		}
	);
} catch (e) {
	alert("Ошибочка вышла!\n" + e);
	return false;
}

/** 
 * Update printQueueList, commit changes
 */
function DRSSCommit(storage) {
	console.log("DRSS parser: All work done, update printQueueList, commit changes...");
	try {
		var number = parseInt(storage.number) + 1;
		var printQueueList = storage.printQueueList.replace(currInQueue + ";", "");
		var updateStorage = {
			number: number,
			printQueueList: printQueueList,
			status: (printQueueList == "") ? WORK_STATUS.READY : WORK_STATUS.PRINTING
		};	
		chrome.storage.local.set(
			updateStorage,
			function () {
				if (chrome.runtime.lastError == null) { 
					location.assign(DRSS_URL[storage.server]);
					 if (storage.printQueueList == "")
						sendMessageToExtension({ text: MESSAGES.CLOSE_TAB });
					sendMessageToExtension({ text: MESSAGES.UPDATE });
				} else {
					alert("DRSS parser: Ошибка при обновлении chrome.storage.local!");
					return false;
				}
			}
		);
	} catch (e) {
		alert("Ошибочка вышла!\n" + e);
		return false;
	}
	return true;
}
 
/**
 * Login to DRSS 
 */
function DRSSLogin(storage) {
	var login = document.querySelector("#P111_USERNAME");
	var passw = document.querySelector("#P111_PASSWORD");
	var loginButton = document.querySelector('a.t20Button');
	try {
		login.value = storage.user;
		passw.value = storage.pass;
		loginButton.click();
	} catch (e) { 
		alert("Ошибочка вышла!\nDRSSLogin(): " + e);
		return false;
	}
	return true;
}

/**
 * Open [Страхувальники] link from MainMenu DRSS
 */
function DRSSOpenFindPage(storage) {
	var DRSSFindMenuItemValue = "Страхувальники";
	var DRSSFindMenuItems = document.querySelectorAll(".dhtmlSubMenuN");
	var DRSSFindMenuItem = null;
	try {
		for (var i = 0; i < DRSSFindMenuItems.length; i++) {
			if (DRSSFindMenuItems[i].innerHTML.trim() == DRSSFindMenuItemValue)
				DRSSFindMenuItem = DRSSFindMenuItems[i];
				break;
			}
			if (DRSSFindMenuItem != null) {
				console.log("DRSS parser: MainmenuItem [" + DRSSFindMenuItemValue + "] finded, entering...");
				DRSSFindMenuItem.click();
			} else {
				console.log("DRSS parser error: MainmenuItem [" + DRSSFindMenuItemValue + "]  not finded!");
				return false;
			}
	} catch (e) {
		alert("Ошибочка вышла!\nDRSSOpenFindPage(): " + e);
		return false;
	}
	return true;
}

/**
 * Query registration information
 * Returned regInfo if data not found
 */
function DRSSQueryDataByPeople(storage) {
	var idInput = document.querySelector("#P1_NUMID");
	try {	
		//prepare "not found" regInfo data
		regInfo.id  = currInQueue.split(",")[0];
		regInfo.fio = currInQueue.split(",")[1];
		regInfo.register = false;
		if (idInput.value == null || idInput.value.trim() == "") {
			//step 1
			console.log("DRSS parser: DRSS query data by people step 1...");
			var findButtons = document.querySelectorAll(".t20Button");
			var findButtonValue = "Пошук";
			var findButton = null;
			for (var i = 0; i < findButtons.length; i++) {
				if (findButtons[i].innerHTML.trim() == findButtonValue) {
					findButton = findButtons[i];
					break;
				}
			}
			if (findButton != null) {
				var selRegionFilter = document.querySelector("#P1_OPFU_REG");
				var selRaionFilter = document.querySelector("#P1_OPFU_DISTR");
				selRegionFilter.selectedIndex = 0; //select "всі" 
				selRaionFilter.selectedIndex = 0; //select "всі"
				idInput.value = currInQueue.split(",")[0];
				findButton.click();
				console.log("DRSS parser: Query registration data...");
				return null;
			} else {
				alert("Ошибочка вышла!\nDRSSQueryDataByPeople(): Find button not finded!");
				return null;
			}
		} else {
			//step 2
			console.log("DRSS parser: DRSS query data by people step 2...");
			var noDataElements = document.querySelectorAll(".nodatafound");
			if (noDataElements.length == 0) {
				//data found
				console.log("DRSS parser: Registration data found OK, try parse...");
				var statusImages = document.querySelectorAll("img");
				var statusRegValue = "Зареєстровано";
				var statusUnRegValue = "Знято з обліку";
				var regDataLink = null;
				var unRegDataLink = null;
				for (var i = 0; i < statusImages.length; i++) {
					//find registered status "Зареєстровано"
					if (statusImages[i].title.trim() == statusRegValue) {
						//link to advanced registration data
						regDataLink = statusImages[i].parentNode;
						break;
					}
					//find unregistered status "Знято з обліку"
					if (statusImages[i].title.trim() == statusUnRegValue) {
						//link to advanced registration data
						unRegDataLink = statusImages[i].parentNode;
					}
				}
				if (regDataLink != null || unRegDataLink != null) {
					//if data exist in statuses "Зареєстровано" or "Знято з обліку"
					console.log("DRSS parser: Entering to advanced registration data...");
					if (regDataLink != null) {
						console.log("DRSS parser: Entering to REGISTER status...");
						regDataLink.click();
						return null;
					}
					if (unRegDataLink != null) {
						console.log("DRSS parser: Entering to CLOSED REGISTRATION status...");
						unRegDataLink.click();
						return null;
					}		
				} else {
					//data found, but status "registered" not found
					console.log("DRSS parser: Status \"" + statusRegValue +
						"\" and \"" + statusUnRegValue + "\" not found!");
					//data not found
					console.log("DRSS parser: Registration data not found!");
					return regInfo;
				}
			} else {
				//data not found
				console.log("DRSS parser: Registration data not found!");
				return regInfo;
			}
		}
	} catch (e) {
		alert("Ошибочка вышла!\nDRSSQueryDataByPeople(): " + e);
		return false;
	}
	return regInfo;
}

/**
 * Entering to MDZU tab
 */
function DRSSEnterToMDZU() {
	var links = document.querySelectorAll("a");
	var MDZUDataTitle = "Дані МДЗУ";
	var AdditionalDataTititle = "Додатково";
	var MDZUDataLink = null;
	var AdditionalLink = null;
	try {
		for (var i = 0; i < links.length; i++) {
			if (links[i].title.trim() == MDZUDataTitle) {
				MDZUDataLink = links[i];
				break;
			}
			if (links[i].title.trim() == AdditionalDataTititle) {
				AdditionalLink = links[i];
			}
		}
		if (MDZUDataLink != null) {
			MDZUDataLink.click();
			return true;
		} else {
			if (AdditionalLink != null) {
				console.log("DRSS parser: Try get no MDZU data registred from ...");
				AdditionalInfo.from = document.querySelector("#P120_IM_DT_PSV").value;
				console.log("DRSS parser: No MDZU data registred from = \"" + AdditionalInfo.from + "\"");
				AdditionalLink.click();
				return true;
			}
			alert("Ошибочка вышла!\nDRSSEnterToMDZU(): link to tab [MDZU] not finded!");
			return false;
		}
	} catch (e) {
		alert("Ошибочка вышла!\nDRSSEnterToMDZU(): " + e);
		return false;
	}
	return true;
}


/**
 * Parsing registration data on page
 * Returned regInfo object
 */
function DRSSParseRegData() {
	var regFromInput = document.querySelector("#P138_IM_DT_PSV");
	var regToInput = document.querySelector("#P138_IAB_STOP_DT");
	try {
		if (regFromInput != null && regFromInput.value.trim() == "") {
			alert("Ошибочка вышла!\DRSSParseRegData(): regFrom data not found!");
			return null;
		}
		if (regToInput != null && regToInput.value.trim() == "") {
			console.log("DRSS parser: DRSSParseRegData(): regTo data not found!");
			var d = new Date();
			var dateStr = d.getDate() + "." + d.getMonth() + "." + d.getFullYear();
			regToInput.value = dateStr;
		}
		regInfo.id  = currInQueue.split(",")[0];
		regInfo.fio = currInQueue.split(",")[1];
		regInfo.register = true;
		regInfo.regFromTo = regFromInput.value + ";" + regToInput.value;
	} catch (e) {
		alert("Ошибочка вышла!\DRSSParseRegData(): " + e);
		return null;
	}
	return regInfo;
}

/**
 * Print in existig tab
 */
function DRSSPrint(regInfo, storage) {
	console.log("DRSS parser: DRSSPrint(): regInfo = " + JSON.stringify(regInfo));
	var isRegisterStr = (regInfo.register) ? "зареєстрований" : "не зареєстрований";
	var from = (regInfo.regFromTo != null) ? regInfo.regFromTo.split(";")[0] : "";
	var to = (regInfo.regFromTo != null) ? regInfo.regFromTo.split(";")[1] : "";
	var toStr = (to.trim() == "") ? " теперешній час " : to;
	var regFromToStr  = (regInfo.regFromTo != null) ? " з " + from + " по " + toStr : "";
	var d = new Date();
	var dateStr = d.getDate() + "." + d.getMonth() + "." + d.getFullYear();
	//head
	document.open("text/html","replace");
	document.write("<h3 align='center'>Довiдка</h3>");
	document.write("<h4 align='center'>№ " + storage.number + " від " + dateStr + "</h4><br>");
	//center
	document.write(
		"Управлiння Пенсiйного фонду в " + storage.region.replace("ий", "ому") + " районі м. Харькова/Харькiвської областi " +
		"повідомляє, що згідно данних Державного реєстру страхувальників Державного реєстру соціального " +
		"страхування (РС ДРСС) гр. <b style='text-decoration:underline'>" + regInfo.fio + "</b>, ідентифікаційний код  " +
		regInfo.id + " <b> " + isRegisterStr + "</b> як суб'єкт підприємницької діяльності. " + regFromToStr +
		"<br><br>Інформація надається станом на " + dateStr + "<br><br>"
		);
	//foot
	document.write(
		"<table width='100%'><tr><td align='left'><b>Начальник відділу<br>персоніфікованого обліку<br>інформаційних систем та мереж</b></td>" + 
		"<td align='right' valign='bottom'><b>__________  &nbsp <p style='text-decoration:underline; display: inline'>/" + storage.boss +
		"/<br></p></b></td></tr><tr><td align='left' valign='bottom'>Виконавець:</td><td align='right'>М.П.<br>__________  &nbsp " +
		"<p style='text-decoration:underline; display: inline'>/" + storage.operator + "/</p></td></tr></table>"
	);
	document.close();
	return window.print();
}


/**
 * Send message to extension
 */
function sendMessageToExtension(msg) {
	console.log("DRSS parser: Send message to extension: " + msg); 
	chrome.runtime.sendMessage(
		msg,
		function (response) {
			console.log("DRSS parser: Responce from extension: " + response.text);
		}
	);
}
