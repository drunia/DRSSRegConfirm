/**
 * Build journal script
 * Author: Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
 
//Get initialized database object
var db = chrome.extension.getBackgroundPage().db;
 
//Start when document loaded
document.addEventListener("DOMContentLoaded", main);
 
//Main function
function main() {
	document.querySelector("#datePicker").addEventListener("change", filter);
	document.querySelector("#printButton").addEventListener("click", printTable);
	var now = new Date();
	var today = now.getDate() + "." + (now.getMonth() + 1) + "." + now.getFullYear();
	document.querySelector("#datePicker").value =
		now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
	buildJournal(today);
 }
 
//Build journal
function buildJournal(date) {
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
	var date = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
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
	console.log("DRSS Journal: Filter by date: " + date);
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
	var number = this.parentNode.parentNode.innerText.trim();
	var row = this.parentNode.parentNode.parentNode;
	if (!confirm("Удалить запись с номером " + number + "?")) return;
	document.querySelector("#queryTable").tBodies[0].removeChild(row);
	db.removeRecord(number);
	
}

//Print reference by row
function printReferenceByRow(){
}
