/**
 * DRSS parser script
 * Author: Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */

var WORK_STATUS = { PRINTING: 1, READY: 2, ERROR: 3 };
var MESSAGES    = { CLOSE_TAB: 10 };
var currInQueue = null;
var registered  = null;

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
					console.log("DRSS parser: Nothing printed!");
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
				switch (stepId) {
					//p_flow_step_id = 111 - Login page
					case "111":
						console.log("DRSS parser: Location: login page, try login...");
						DRSSLogin(storage);
					break;
					//p_flow_step_id = 1000 - Mainmenu page
					case "1000":
						console.log("DRSS parser: Location Mainmenu page, try open find page...");
						DRSSOpenFindPage(storage);
					break;		
					//p_flow_step_id = 1 - Find page
					case "1":
						console.log("DRSS parser: Location DRSS Find page, try query by people...");
						var regInfo = DRSSQueryDataByPeople(storage);
						if (regInfo != null) print(regInfo, storage);
					break;
					//p_flow_step_id = 128 - Advanced registration info page
					case "128":
						console.log("DRSS parser: Location DRSS advanced registration info page, parse...");
						DRSSEnterToMDZU();
					break;
					//p_flow_step_id = 128 - Advanced registration info page [Дані МДЗУ]
					case "138":
						console.log("DRSS parser: Location DRSS advanced registration info page [Дані МДЗУ], parse...");
						var regInfo = DRSSParseRegData();
						if (regInfo != null) print(regInfo, storage);
					break;
					default: 
						console.log("DRSS parser: Unknown location, STOP parse!");
						return false;
				}
			} else console.log("DRSS parser: Extension DRSSRegConfirm not in status PRINTING..."); 
		}
	);
} catch (e) {
	alert("Ошибочка вышла!\n" + e);
	return false;
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
 * Open [Страхувальники (МДЗУ)] link from MainMenu DRSS
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
	var regInfo = { id: null, fio: null, register: null, regFromTo: null };
	var idInput = document.querySelector("#P1_NUMID");
	try {	
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
						registered = true;
						return null;
					}
					if (unRegDataLink != null) {
						console.log("DRSS parser: Entering to UNREGISTER status...");
						unRegDataLink.click();
						registered = false;
						return null;
					}		
				} else {
					//data found, but status "registered" not found
					console.log("DRSS parser: Status \"" + statusRegValue + "\" not found!");
					regInfo.id  = currInQueue.split(",")[0];
					regInfo.fio = currInQueue.split(",")[1];
					regInfo.register = false;
					return regInfo;
				}
			} else {
				//data not found
				console.log("DRSS parser: Registration data not found!");
				regInfo.id  = currInQueue.split(",")[0];
				regInfo.fio = currInQueue.split(",")[1];
				regInfo.register = false;
				return regInfo;
			}
		}
	} catch (e) {
		alert("Ошибочка вышла!\DRSSQueryDataByPeople(): " + e);
		return false;
	}
	return regInfo;
}

/**
 * Entering to MDZU tab
 */
function DRSSEnterToMDZU() {
	var links = document.querySelector("a");
	var MDZUDataTitle = "Дані МДЗУ";
	var MDZUDataLink = null;
	try {
		for (var i = 0; i < links.length; i++) {
			if (links[i].title.trim() == MDZUDataTitle) {
				MDZUDataLink = links[i];
				break;
			}
		}
		if (MDZUDataLink != null) {
			MDZUDataLink.click();
		} else {
			alert("Ошибочка вышла!\DRSSEnterToMDZU(): link to tab [MDZU] not finded");
			return false;
		}
	} catch (e) {
		alert("Ошибочка вышла!\DRSSEnterToMDZU(): " + e);
		return false;
	}
	return true;
}

/**
 * Parsing registration data on page
 * Returned regInfo object
 */
function DRSSParseRegData() {
	var regInfo = { id: null, fio: null, register: null, regFromTo: null };
	var regFromInput = document.querySelector("#P138_IM_DT_PSV");
	var regToInput = document.querySelector("P138_IAB_STOP_DT");
	if (regFromInput == null) {
		alert("Ошибочка вышла!\DRSSParseRegData(): regFrom data not found!");
		return null;
	}
	if (regToInput == null)
		console.log("DRSS parser: DRSSParseRegData(): regTo data not found!");
	regInfo.id  = currInQueue.split(",")[0];
	regInfo.fio = currInQueue.split(",")[1];
	regInfo.register = registered;
	regInfo.regFromTo = regFromInput.value + ";" + regToInput.value;
	return regInfo;
}

/**
 * Print in existig tab
 */
function print(regInfo, storage) {
	var isRegisterStr = (regInfo.register) ? "зареєстрований" : "не зареєстрований";
	var regFromToStr  = (regInfo.register) ? regInfo.regFromTo : "";
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
		"страхування (РС ДРСС) гр. " + regInfo.fio + ", ідентифікаційний код  " + regInfo.id + " <b> " + isRegisterStr +
		"</b> як суб'єкт підприємницької діяльності. " + regFromToStr + "<br><br>Інформація надається станом на " + dateStr + "<br><br>"
		);
	//foot
	document.write(
		"<table width='100%'><tr><td align='left'><b>Начальник відділу<br>персоніфікованого обліку<br>інформаційних систем та мереж</b></td>" + 
		"<td align='right' valign='bottom'><b>__________  &nbsp <p style='text-decoration:underline; display: inline'>/" + storage.boss + "/<br></p></b></td></tr>" +
		"<tr><td align='left' valign='bottom'>Виконавець:</td><td align='right'>М.П.<br>__________  &nbsp " +
		"<p style='text-decoration:underline; display: inline'>/" + storage.operator + "/</p></td></tr></table>"
	);
	document.close();
	return true;
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
