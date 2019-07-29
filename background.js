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
			if (bookmark.parentId === undefined) {
				continue;
			}

			let extendedBookmark = extendBookmarkInformations(bookmark);
			console.log(extendedBookmark);

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

var smartmark = {
	tree: null,
	root: null, // Root node.
	nodeScanStatus: [
		{
			index: null,
			scannerId: null,
			parent: null,
			node: null,
			children: null,
			prevChild: null,
			currChild: null,
			status: null // "paused" | "running" | "completed"
		}
	]
}

/*
 * TODO: even if this is not the best solution probably (I mean: using a global
 * variable to store the found folder) it didn't figured out a better idea.
 */
var foundFolder = null;

function searchFolderCallback(folder) {
	console.log(folder);
}

/**
 * Search the tree for a 'node' named like 'str'. This is a recursive function.
 * @param  {BookmarkTreeNode}   node     The node from wich to start searching.
 * @param  {string|String}   	str      The string we seach for (it is compared to the title of the node).
 * @param  {Function} 			callback A callback called when we find the searched node.
 */
function searchFolder(node, str, callback) {
	// First of all I check if the 'url' property is undefined: if not, return
	// false. In fact we are searching for a folder node and, accordingly to
	// official Google Chrome Extensions documentation, 'url' property is
	// "omitted" (https://developer.chrome.com/extensions/bookmarks#type-BookmarkTreeNode).
	// "omitted" is a term that gave me a slightly headache. I expected a more
	// proper language in the reference of a JavaScript API. Though I guessed
	// they meant "undefined".
	// NOTE: return value is used later to help prevent the algorithm
	// traversing all the tree even if we have already found the folder we were
	// searching for.
	if (node.url !== undefined) {
		return false;
	}

	// Then I compare the title of the node with the searched string.
	// If they are equal I assign node object to foundFolder variable, this way
	// I make it visible to the rest of the script code.
	// TODO: in the future I would like to implement more sophisticated string
	// comparison, I could, for exmple, make a case insensitive comparison.
	if (node.title === str) {
		foundFolder = node;
		console.log('FOUND', foundFolder);
		// if (callback !== undefined && callback != null && typeof callback === 'function') {
		// 	callback(node);
		// }
		return true;
	}

	// The folder could have children or not but the Google Chrome documentation
	// is not very clear about the actual behavior of this function.
	// NOTE: Google Chroome documentation does not explain it but I tested that
	// all the functions that take a callback as a parameter are asyncronous.
	chrome.bookmarks.getChildren(node.id, function (children) {
		// If children property is undefined, null or has length equal to zero
		// this function returns immediatly.
		if (children === undefined || children === null || children.length === 0) {
			return;
		}

		for (child of children) {
			// Recursively call searchFolder() passing the current child as the
			// node parameter. In this case we also store the returned value
			// into 'found' variable.
			let found = searchFolder(child, str, callback);

			// If found is equal true, it means we already found what we were
			// looking for. Therefore we exit this loop.
			// NOTE: there can be more then a folder with the same name in the
			// tree. There could be cases where we would like to collect them
			// all.
			// NOTE: checking for foundFolder nullity is probably just paranoia.
			if (found === true && foundFolder !== null) {
				break;
			}
		}
	});

	return false;
}

/**
 * [getTreeCallback description]
 * @param  {Array} tree The bookmarks tree passed to this callback by the
 * 						getTree() function.
 */
function getTreeCallback(tree) {
	smartmark.root = tree[0];

	searchFolder(smartmark.root, 'Bootstrap');
}

/**
 * Get the entire bookmarks tree.
 * @param  {Function} callback The callback to call when the tree is ready.
 */
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
