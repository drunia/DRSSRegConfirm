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
			if (message.text == "CLOSE_TAB") {
				chrome.tabs.remove(parsedTabId);
			}
			//UPDATE MESSAGE
			if (message.text == "UPDATE") {
				updateStatusIcon();
			}
			//ADD DATA TO DATABASE MESSAGE
			if (message.text == "ADD_TO_DB") {
				db.addRecord(message.regInfo);			
			}
			//PRINT DATA BY ZO
			if (message.text == "PRINT") {
				DRSSPrint(message.regInfo);
			}
			sendResponce( {text: "OK."} );
		}
	)
	 
} catch (e) {
	alert("Произошла ошибка при инициализации расширения:\n" + e);
	return false;
}

/**
 * Database object - work with database
 */
var Database = function () {
	var dbName = "drss_db";
	var dbVer  = 1;
	var dbSize = 10 * 1024 * 1024;
	var dbDesc = "DRSS journal database";
	
	//All errors hadled with this function
	var errorHandler = function (t, e) {
		console.log("DRSS Database ERROR: " + e.message);
		alert("При работе с БД возникла ошибка:\n" + e.message);
	}

	try {
		//Construct db & update version
		this.db = openDatabase(dbName, "1", dbDesc, dbSize);
		this.db.transaction(
			function(t) {
				console.log("DRSS Database: Initialize database...");
				t.executeSql("CREATE TABLE IF NOT EXISTS version (ver TEXT)", [],
					function(t, rs) {
						console.log("DRSS Database: Check database version...");
						t.executeSql("SELECT ver FROM version", [], function(t, rs) {
							var sql;
							if (rs.rows.length == 0) { //ver 1
								console.log("DRSS Database: Creating database... ");
								sql = "CREATE TABLE journal (numb TEXT, id_code TEXT, fio TEXT, operator TEXT, date TEXT);";
								t.executeSql(sql, [],
									function() { console.log("DRSS Database: Table journal created OK."); },
									errorHandler
								);
								sql = "INSERT INTO version VALUES (?);";
								t.executeSql(sql, [String(dbVer)], 
									function() { console.log("DRSS Database: Database ver: " + String(dbVer) + " created OK."); },
									errorHandler
								);
								return true;
							}
							var db_ver = rs.rows.item(rs.rows.length-1).ver;
							if (db_ver >= dbVer) {
								console.log("DRSS Database: Already updated, current db ver.: " + db_ver);
								this.db.version = db_ver;
								return true;
							}
							console.log("DRSS Database: Updating database " + String(db_ver) + " -> " + dbVer);
							//Code for updating db
							//-------------------
						}, errorHandler);
					}, errorHandler);
			}, errorHandler
		);
	} catch (e) {
		error = {message: e}
		errorHandler(null, error);
	}
	
	//Add new record to db
	this.addRecord = function(regInfo) {
		this.db.transaction(
			function(t) {
				console.log("DRSS Database: Try add data: " + JSON.stringify(regInfo));
				var d = new Date();
				var dataStr = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
				t.executeSql("INSERT INTO journal VALUES (?,?,?,?,?);",
					[String(regInfo.numb), String(regInfo.id), regInfo.fio, regInfo.operator, String(dataStr)],
					function(t, r) { console.log("DRSS Database: Data added OK."); },
					errorHandler
				);
			}
		);
	}
	
	//Get records from db
	//How can use: db.getRecords(function(t, r) {console.log("data length: " + r.rows.length;)})
	this.getRecords = function(getRecordsHandler) {
		console.log("DRSS Database: Try get data...");
		this.db.transaction(function (t) {
			t.executeSql("SELECT * FROM journal;", [],
				getRecordsHandler, errorHandler
			);
		});
	}
	
	//Remove record from db
	this.removeRecord = function(removeNumber) {
		this.db.transaction(
			function(t) {
				console.log("DRSS Database: Try remove record by number " + removeNumber);
				t.executeSql(
					"DELETE FROM journal WHERE numb=?", [removeNumber],
					function() {console.log("DRSS Database: Remove execSQL OK.")} , errorHandler
				);
			}
		);
	}
	
	//init version
	this.version = this.db.version;
}
var db = new Database();

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
 * Print in existig tab
 */
function DRSSPrint(regInfo) {
	console.log("DRSS background: DRSSPrint(): regInfo = " + JSON.stringify(regInfo));
	var w = window.open();
	var isRegisterStr = (regInfo.register) ? "зареєстрований" : "не зареєстрований";
	var from = (regInfo.regFromTo != null) ? regInfo.regFromTo.split(";")[0] : "";
	var to = (regInfo.regFromTo != null) ? regInfo.regFromTo.split(";")[1] : "";
	var toStr = (to.trim() == "") ? " теперешній час " : to;
	var regFromToStr  = (regInfo.regFromTo != null) ? " з " + from + " по " + toStr : "";
	var d = new Date();
	var dateStr = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
	//head
	w.document.open("text/html","replace");
	w.document.write("<title>" + regInfo.fio + "</title>");
	w.document.write("<h3 align='center'>Довiдка</h3>");
	w.document.write("<h4 align='center'>№ " + regInfo.numb + " від " + dateStr + "</h4><br>");
	//center
	w.document.write(
		"Управлiння Пенсiйного фонду в " + regInfo.region.replace("ий", "ому") + " районі м. Харькова/Харькiвської областi " +
		"повідомляє, що згідно данних Державного реєстру страхувальників Державного реєстру соціального " +
		"страхування (РС ДРСС) гр. <b style='text-decoration:underline'>" + regInfo.fio + "</b>, ідентифікаційний код  " +
		regInfo.id + " <b> " + isRegisterStr + "</b> як суб'єкт підприємницької діяльності. " + regFromToStr +
		"<br><br>Інформація надається станом на " + dateStr + "<br><br>"
		);
	//foot
	w.document.write(
		"<table width='100%'><tr><td align='left'><b>Начальник відділу<br>персоніфікованого обліку<br>інформаційних систем та мереж</b></td>" + 
		"<td align='right' valign='bottom'><b>__________  &nbsp <p style='text-decoration:underline; display: inline'>/" + regInfo.boss +
		"/<br></p></b></td></tr><tr><td align='left' valign='bottom'>Виконавець:</td><td align='right'>М.П.<br>__________  &nbsp " +
		"<p style='text-decoration:underline; display: inline'>/" + regInfo.operator + "/</p></td></tr></table>"
	);
	w.document.close();
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