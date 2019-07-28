let search_bootstrap = document.getElementById('search_bootstrap');
// console.log(search_bootstrap);

search_bootstrap.onclick = function (element) {
	// console.log('Clicked');

	// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	// 	var activeTab = tabs[0];
	//
	// 	chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
	// });

	chrome.runtime.sendMessage({"message": "clicked_browser_action"});
};
