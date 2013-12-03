/**
 * Build journal script
 * Author: Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
 
//Get initialized database object
var backPage = chrome.extension.getBackgroundPage();
var db = backPage.db;
var regColor = "#EFFBF2";
var unRegColor = "#FBF8EF";
 
//Import functions//
var leadZeros = backPage.leadZeros;
 
//Start when document loaded
document.addEventListener("DOMContentLoaded", main);
 
//Main function
function main() {
	document.querySelector("#datePicker").addEventListener("change", filter);
	document.querySelector("#printButton").addEventListener("click", printTable);
	document.querySelector("#delAllButton").addEventListener("click", deleteJournal);
	var now = new Date();
	var today = leadZeros(now.getDate(), 2) + "." + leadZeros((now.getMonth() + 1), 2) +
		"." + now.getFullYear();
	var todayByPicker = now.getFullYear() + "-" + leadZeros((now.getMonth() + 1), 2) +
		"-" + leadZeros(now.getDate(), 2);
	document.querySelector("#datePicker").value = todayByPicker
	buildJournal(today);
 }
 
//Delete all records from database
function deleteJournal() {
	if (!confirm("Вы уверены, что хотите удалить все записи с журнала?")) return fasle;
	if (!confirm("Нет, Вы подумайте еще раз! Точно удалить все!?")) return fasle;
	db.removeRecord("%", function() { location.reload(); });
}
 
//Build journal
function buildJournal(date) {
	console.log("DRSS Journal: Build journal by date: " + date);
	var queryTable = document.querySelector("#queryTable");
	var row = document.querySelector("#dataRow");
	var records = 0;
	db.getRecords(
		function(t, r) {
			for (var i = 0; i < r.rows.length; i++) {
				if (date != null && date.trim() != r.rows.item(i).date.trim()) continue;
				row.childNodes[1].innerHTML = 
					"<div id='rowService' style='display: inline-block'>" +
					"<input type='image' src='delete16.png' id='deleteRow' title='Удалить'>" +
					"<input type='image' src='print16.png' id='printRow' title='Распечатать'></div>" +
					"&nbsp&nbsp" + r.rows.item(i).numb;
				row.childNodes[3].innerHTML = r.rows.item(i).date;
				row.childNodes[5].innerHTML = r.rows.item(i).id_code;
				row.childNodes[7].innerHTML = r.rows.item(i).fio;
				row.childNodes[9].innerHTML = r.rows.item(i).operator;
				var rowId = row.childNodes[row.childNodes.length-2].value = r.rows.item(i).rowid;
				//Row color
				if (r.rows.item(i).reg == "true") 
					row.setAttribute("bgcolor", regColor);
				else 
					row.setAttribute("bgcolor", unRegColor);
				//Clone row
				var newRow = row.cloneNode(true);
				queryTable.tBodies[0].appendChild(row);
				row = newRow;
				records++;
			}
			//Add event listeners to rowService elements
			var deleteButtons = document.querySelectorAll("#deleteRow");
			var printButtons = document.querySelectorAll("#printRow");
			for (var i = 0; i < deleteButtons.length; i++) {
				deleteButtons[i].addEventListener("click", deleteRecordByRow);
				printButtons[i].addEventListener("click", printReferenceByRow);
			}
			//Set display total records
			document.querySelector("#totalRecords").innerHTML = "Записей: " + records;
		}
	);
 }

//Filter records by date 
//datePicker onchange handler
function filter() {
	var d = new Date(this.value);
	var date = leadZeros(d.getDate(), 2) + "." + leadZeros((d.getMonth() + 1), 2) + "." + d.getFullYear();
	var queryTable = document.querySelector("#queryTable");
	var row = document.querySelector("#dataRow").cloneNode(true);
	//clear row data
	for (var i = 0; i < row.childNodes.length; i++)
		row.childNodes[i].innerHTML = "";
	//delete all rows
	var rows = document.querySelectorAll("#dataRow");
	for (var i = 0; i < rows.length; i++) 
		queryTable.tBodies[0].removeChild(rows[i]);
	//add first row
	queryTable.tBodies[0].appendChild(row);
	if (this.validity.valid && this.value == "")
		buildJournal(null);
	else if (this.validity.valid) buildJournal(date);
}

//Print queries table
function printTable() {
	var filter = document.querySelector("#filter");
	var rowServices = document.querySelectorAll("#rowService");
	//disable before printing
	for (var i = 0; i < rowServices.length; i++)
		rowServices[i].style.display = "none";
	filter.style.display = "none";
	print();
	//enable after printing
	for (var i = 0; i < rowServices.length; i++)
		rowServices[i].style.display = "inline-block";
	filter.style.display = "block";
}

//Delete record from db by row
function deleteRecordByRow() {
	var row = this.parentNode.parentNode.parentNode;
	var number = row.childNodes[1].innerText.trim();
	var rowId = row.childNodes[row.childNodes.length-2].value;
	if (!confirm("Удалить запись с номером " + number + " ?")) return;
	//Remove record by rowid
	db.removeRecord(
		rowId,
		function() {
			document.querySelector("#queryTable").tBodies[0].removeChild(row);
			console.log("DRSS Database: Remove record by rowid " + rowId + " success.");
		}
	);
}

//Print reference by row
function printReferenceByRow(){
	var row = this.parentNode.parentNode.parentNode;
	var rowId = row.childNodes[row.childNodes.length-2].value;
	db.getRecords(
		function(t, r) {
			if (r.rows.length != 1) {
				var errText = "Ошибочка вышла!\nНевозможно выбрать из БД запись под номером \"" +
					numb + "\" для печати справки."; 
				console.log(errText);
				alert(errText);
				return;
			}
			var dbRow = r.rows.item(0);
			var regInfo = {
				id: dbRow.id_code,
				fio: dbRow.fio,
				register: dbRow.reg,
				regFromTo: dbRow.regfromto,
				numb: dbRow.numb,
				operator: dbRow.operator,
				boss: dbRow.boss,
				region: dbRow.region
			}
			backPage.DRSSPrint(regInfo);
		}, null, rowId
	);
}

