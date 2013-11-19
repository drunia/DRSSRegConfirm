/**
 * DRSS parser script
 * Author: Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
 
var WORK_STATUS = { PRINTING: 1, READY: 2, ERROR: 3 };
var user, pass;


/**
 * Check parse needed
 */
chrome.storage.local.get(
	function (storage) {
		if (storage.status != null && storage.status == WORK_STATUS.PRINTING) {		
			user = storage.user;
			pass = storage.pass;
			if (storage.printQueueList.split(";").length-1 == 0) {
				console.log("DRSS parser: Nothing printed!");
				return false;
			}
			console.log("DRSS parser: Starting parse DRSS..."); 
			var stepId = document.getElementsByName("p_flow_step_id");
			if (stepId == null) {
				console.log("DRSS parser error: Unknown location, parse stopping!");
				return false;
			} else stepId = stepId[0].value;
			//Detect location
			switch (stepId) {
				//111 - login page
				case "111":
					console.log("DRSS parser: Detect login page, try login...");
					DRSSLogin();
					break;
				//1000 - main menu page
				case "1000":
					console.log("DRSS parser: Detect main menu page, try select [" + DRSSFindMenuItemValue + "]...");
					var DRSSFindMenuItemValue = "Страхувальники (МДЗУ)";
					var DRSSFindMenuItems = document.querySelectorAll(".dhtmlSubMenuN");
					var DRSSFindMenuItem = null;
					for (var i = 0; i < DRSSFindMenuItems.length; i++) {
						if (DRSSFindMenuItems[i].innerHTML.trim() == DRSSFindMenuItemValue)
							DRSSFindMenuItem = DRSSFindMenuItems[i];
					}
					if (DRSSFindMenuItem != null) {
						console.log("DRSS parser: MainmenuItem [" + DRSSFindMenuItemValue + "] finded, click him...");
						DRSSFindMenuItem.click();
					} else {
						console.log("DRSS parser error: MainmenuItem [" + DRSSFindMenuItemValue + "]  not finded stopped!");
						return false;
					}
					break;
				//DRSS find page
				case "1":
					console.log("DRSS parser: Detect DRSS find page, try query...");
					var drfoInput = document.querySelector("#P1_NUMID");
					var findButton = document.querySelector(".t20Button");
					var id = storage.printQueueList.split(";")[0].split(",")[0];
					var fio = storage.printQueueList.split(";")[0].split(",")[1];
					//step 1 - form not filling
					if (drfoInput.value == null || drfoInput.value.trim() == "") {	
						drfoInput.value = id;
						findButton.click();
						return true;
					}
					//step 2 - verifying find result
					if (document.querySelectorAll(".nodatafound").length == 0) {
						//data exist
						console.log("DRSS parser: Data by [" + id + "] found!, try parse...");
						var isRegisterZoValue = "Зареєстровано";
						var isRegister = false;
						var imgs = document.querySelectorAll("img");
						for (var i = 0; i < imgs.length; i++) {
							if (imgs[i].title.trim() == isRegisterZoValue)
								isRegister = true;
						}
						//Printing result
						var printInfo = {id: id, fio: fio, register: isRegister, regFromTo: "З 2002 по 2013"};
						_print(printInfo, storage);
					} else {
						//data not exist
						console.log("DRSS parser: Data by [" + id + "] not found.");
						var printInfo = {id: id, fio: fio, register: false, regFromTo: null};
						_print(printInfo, storage);
					}
					break;
				default: 
					console.log("DRSS parser error: Unknown location, parse stopping!");
					return false;
			}
		} else console.log("DRSS parser: DRSSRegConfirm not working now, sleep..."); 
	}
);

/**
 * Printing data by zo
 */
function print(id, fio, isRegister) {
	var printInfo = {
		print: true,
		id: id,
		fio: fio,
		isRegister: isRegister
	}
	sendMessageToExtension(printInfo);
}

/**
 * Print in existig tab
 */
function _print(printInfo, storage) {
	var isRegisterStr = (printInfo.register) ? "зареєстрований" : "не зареєстрований";
	var regFromToStr  = (printInfo.register) ? printInfo.regFromTo : "";
	var d = new Date();
	var dateStr = d.getDate() + "." + d.getMonth() + "." + d.getFullYear();
	document.open("text/html","replace");
	document.write("<h3 align='center'>Довiдка</h3>");
	document.write("<h4 align='center'>№ " + storage.number + " від " + dateStr + "</h4><br>");
	//head
	document.write(
		"Управлiння Пенсiйного фонду в " + storage.region.replace("ий", "ому") + " районі м. Харькова/Харькiвської областi " +
		"повідомляє, що згідно данних Державного реєстру страхувальників Державного реєстру соціального " +
		"страхування (РС ДРСС) гр. " + printInfo.fio + ", ідентифікаційний код  " + printInfo.id + " <b> " + isRegisterStr +
		"</b> як суб'єкт підприємницької діяльності. " + regFromToStr + "<br>Інформація надається станом на " + dateStr
	);
	//foot
	/*document.write(	"р.<br><br><span style='float: left;'>Начальник відділу<br>персоніфікованого обліку<br>" +
		"інформаційних систем та мереж</span><span style='float: right;'>___________  / " + storage.boss + " / <br><br>" +
		"М.П.</span><br><br><span style='float: left;'>Виконавець:</span><span style='float: right;'>___________  / " + storage.user +
		" /</span>"
	);*/
	document.close();
}

/**
 * Login to DRSS 
 */
function DRSSLogin() {
	var login = document.querySelector("#P111_USERNAME");
	var passw = document.querySelector("#P111_PASSWORD");
	var loginButton = document.querySelector('a.t20Button');
	
	login.value = user;
	passw.value = pass;
	loginButton.click();
}

/**
 * Send message to extension
 */
function sendMessageToExtension(msg) {
	chrome.runtime.sendMessage( 
		msg,
		function (response) {
			console.log("DRSS parser: " + response.text);
		}
	);
}
