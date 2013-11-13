/**
 * Main script file DRSSRegConfirm
 * Andrunin Dmitry, drunia@xakep.ru, bogoduh@kharkov1.kharkov.pfu.gov
 */
 
/**
 * Registering events on DRSSRegConfirm.html
 */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#start').addEventListener('click', start);
});
 
/**
 * Create notification to notificate user when work is done
 */



/**
 * Start working with DRSS
 */
function start() {
	var notification = webkitNotifications.createNotification(
		"icon.png", "Отчет о проделаной работе", "Привет Сеня!!!"
	);
	notification.show();
}