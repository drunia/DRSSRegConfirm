/**
 * Main script file DRSSRegConfirm
 * Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
 
/**
 * Registering start app point on DRSSRegConfirm.html
 */
document.addEventListener('DOMContentLoaded', main);
 
/**
 * Main start application point
 */
function main() {
	document.querySelector('#addButton').addEventListener('click', addToZoTable);
} 

/**
 * Add new people into printing table
 */
function addToZoTable() {
	var idCode = document.querySelector('#IdInput').value;
	var fio = document.querySelector('#FIOInput').value;
	
	if (trim(idCode == "") || trim(fio == "")) {
		alert("Пустые значения недопустимы!");
		return;
	}
}
 
/**
 * Create notification to notificate user 
 */
function notificate(title, message) {
	webkitNotifications.createNotification("icon.png", title, message).show();
}

/**
 * Delete spaces from string
 */
function trim(str) { 
	str += " ";
	str = str.replace(/^\ /, '');
	str = str.replace(/\ $/, '');
	return str;
}