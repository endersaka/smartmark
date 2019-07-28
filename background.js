// PageStateMatcher options.
var psmOptions = {
	pageUrl: {
		hostEquals: 'developer.chrome.com' // Domain that activates this extension
	}
};

// PageStateMatcher is used to check if the current Web Page matches our requirements.
var psm = new chrome.declarativeContent.PageStateMatcher(psmOptions);

// ShowPageAction shows the extension's page action while the corresponding conditions are met.
var action = new chrome.declarativeContent.ShowPageAction();

// Set rules with the variables we have initialized before.
var rules = [
	{
		conditions: [ psm ],
		actions: [ action ]
	}
];

function extendBookmarkInformations(bookmark) {
	let pattern = /(http[s]):\/\/([a-zA-Z0-9_-]*(\.[a-zA-Z0-9_-]*)*)((\/[a-zA-Z0-9\._-]*)*)(#[a-zA-Z0-9_-]*)?(\?.*)?/ug;
	let regExp = new RegExp(pattern);
	let match = regExp.exec(bookmark.url);

	// match[2] is the host
	// match[4] is the path
	// match[6] is the anchor name

	bookmark.extended_informations = {
		path: {
			reversed_components: undefined
		},
		title: undefined
	};

	if (match !== null && match.length > 1) {
		// console.log('matches:', match);

		// Get path component filtering out empty strings ("").
		let components = match[4].split('/').filter(element => element !== "").reverse();
		// console.log('pathComponents:', components);

		bookmark.extended_informations.path.reversed_components = components;
	}

	bookmark.extended_informations.title = bookmark.title.split(/\s*(?:-|_|\||\/|\\|:|;)?\s+/ug);

	return bookmark;
}

function arrangeBootstrap() {
	chrome.bookmarks.search('bootstrap OR Bootstrap', function(bookmarks) {
		for (bookmark of bookmarks) {
			// console.log('%s %s %s', bookmark.title, bookmark.url, bookmark.parentId);

			if (bookmark.parentId === undefined) {
				continue;
			}

			let extendedBookmark = extendBookmarkInformations(bookmark);

			// if (bookmark.hasOwnProperty('children')) {
				console.log(extendedBookmark);
			// }

			// chrome.bookmarks.get(parentId, function (results) {
			// 	if (results.length > 0) {
			// 		console.log(results[0]);
			//
			//
			// 			// let i = 0;
			// 			// for(let component of pathComponents) {
			// 			// 	if (results[0].title === component) {
			// 			// 		console.log('Correspondence found: component "%s"; parent.title "%s"', component, results[0].title);
			// 			// 		break;
			// 			// 	}
			// 			//
			// 			// 	i++;
			// 			// }
			// 	} else {
			// 		console.log('No parent found...');
			// 	}
			// });
		}
	});
}

var foundNode = null;
function searchFolder(node, searchStr) {
	if (node.url !== undefined) {
		return;
	}

	if (node.title === searchStr) {
		foundNode = node;
		return;
	}

	chrome.bookmarks.getChildren(node.id, function (children) {
		console.log('Node "%s" %s', node.title, node.id);

		if (children === null || children.length === 0) {
			return;
		}

		for (child of children) {
			searchFolder(child, searchStr);
		}
	});
}

// var bookmarkChildFound = false;
// function searchChildWithTitle(children, title) {
// 	let currChild = null;
//
// 	for (child of children) {
// 		if (!bookmarkChildFound) {
// 			currChild = child;
// 			bookmarkChildFound = child.title === title;
// 			continue;
// 		}
// 		break;
// 	}
//
// 	return currChild;
// }

// function getChildrenCallback(children) {
// 	if (bookmarkChildFound) {
// 		return;
// 	}
//
// 	let result = searchChildWithTitle(children, 'Preferiti su disp. mobili');
//
// 	if (result === null) {
// 		console.log(result);
// 	} else {
// 		for (child of children) {
// 			chrome.bookmarks.getChildren(child.id, getChildrenCallback);
// 		}
// 	}
// }

function getTreeCallback(tree) {
	console.log('Number of elements in the tree:', tree.length);
	console.log(tree);

	// Start exploration. root is tree[0].
	//chrome.bookmarks.getChildren(tree[0].id, getChildrenCallback);

	searchFolder(tree[0], 'IT');

	if (foundNode !== null) {
		console.log(foundNode);
	}
}

function getTree(callback) {
	chrome.bookmarks.getTree(callback);
}

chrome.runtime.onInstalled.addListener(function () {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
		chrome.declarativeContent.onPageChanged.addRules(rules);
	});

	chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
		if ( request.message === "clicked_browser_action" ) {
			//arrangeBootstrap();
			getTree(getTreeCallback);
		}
	});
});
