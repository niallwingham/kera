(function () {
	"use strict";

	var DESCENDENT_COMBINATOR = ' ',
		CHILD_COMBINATOR = ' > ',
		reporting = false;

	function startReporting() {
		if (!reporting) {
			console.log('Starting reporting...');
			window.addEventListener('click', reportClick);
			window.addEventListener('change', reportInputChange);
			window.addEventListener('hashchange', reportLocationChange);
			reporting = true;
		}
	}

	function stopReporting() {
		if (reporting) {
			reporting = false;
			window.removeEventListener('click', reportClick);
			window.removeEventListener('change', reportInputChange);
			window.removeEventListener('hashchange', reportLocationChange);
			console.log('Stopped reporting');
		}
	}

	function reportEvent(event) {
		chrome.extension.sendMessage({
			type: 'event',
			body: event
		});
	}

	function reportClick(event) {
		reportEvent({
			type: 'click',
			path: uniqueSelector(event.target)
		});
	}

	function reportInputChange(event) {
		reportEvent({
			type: 'input_change',
			path: uniqueSelector(event.target),
			text: event.target.value
		});
	}

	function reportLocationChange(event) {
		reportEvent({
			type: 'page_transition',
			href: window.location.href
		});
	}

	function uniqueSelector(element) {
		var uniqueSelector,
		    currentElement,
		    currentElementSelector,
		    parentElement = element,
		    nextCombinator = CHILD_COMBINATOR,
		    validRoot = false;

		do {
			// Step up the DOM tree
			currentElement = parentElement;
			parentElement = currentElement.parentElement;

			// Try to uniquely identify the current element with a basic selector, and make
			// sure that it's at least uniquely identified within its parent's subtree.
			currentElementSelector = basicSelector(currentElement);
			if (document.querySelectorAll(currentElementSelector).length === 1) {
				validRoot = true;
			} else if (parentElement.querySelectorAll(currentElementSelector).length !== 1) {
				currentElementSelector += nthChildSelector(currentElement);
			}

			// If we've found a valid root, or traversed far enough up the tree that our accumulated
			// selector no longer uniquely identifies the target element, prepend this element's selector.
			if (!uniqueSelector) {
				uniqueSelector = currentElementSelector;
			} else if (validRoot || parentElement.querySelectorAll(uniqueSelector).length !== 1) {
				uniqueSelector = currentElementSelector + nextCombinator + uniqueSelector;
				nextCombinator = CHILD_COMBINATOR;
			} else {
				nextCombinator = DESCENDENT_COMBINATOR;
			}
		} while (!validRoot);

		return uniqueSelector;
	}

	function basicSelector(element) {
		if (element.id) {
			return '#' + element.id;
		} else if (element.className) {
			return '.' + element.className.replace(/ /g, '.');
		} else {
			return element.tagName.toLowerCase();
		}
	}

	function nthChildSelector(element) {
		if (element.previousElementSibling === null) {
			return ':first-child';
		} else if (element.nextElementSibling === null) {
			return ':last-child';
		} else {
			return ':nth-child(' + (indexOf(element) + 1) + ')';
		}
	}

	function indexOf(element) {
		return Array.prototype.slice.call(element.parentElement.children).indexOf(element);
	}

	// Setup message handlers
	Messages.addHandler('start', startReporting);
	Messages.addHandler('stop', startReporting);

	// Report our current location (a session may already be in progress)
	reportLocationChange();
})();