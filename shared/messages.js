var Messages;
(function (Messages) {
	"use strict";

	var handlers = {};

	function getHandlerList(type) {
		return handlers[type] || (handlers[type] = []);
	}

	function addHandler(type, callback, context) {
		getHandlerList(type).push({
			callback: callback,
			context: context
		});
	}

	function removeHandler(type, callback) {
		handlers[type] = getHandlerList(type).filter(function (handler) {
			return handler.callback !== callback;
		});
	}

	chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
		var type, args;
		if (typeof message === 'string') {
			type = message;
			args = [sender, sendResponse];
		} else {
			type = message.type;
			args = [message.body, sender, sendResponse];
		}
		getHandlerList(type).forEach(function (handler) {
			handler.callback.apply(handler.context, args);
		});
	});

	Messages.addHandler = addHandler;
	Messages.removeHandler = removeHandler;

})(Messages || (Messages = {}));