(function () {
	"use strict";

	var browserAction = chrome.browserAction,
		sessions = {},
		MOVE_DELAY_MS = 250;

	function recordEvent(event, sender, sendResponse) {
		var session = sessions[sender.tab.id];
		if (session) {
			// Timestamp the incoming event
			event.time = Date.now() - session.startTime;

			// If the event has a new path, insert a move event
			if (event.path && event.path !== session.currentPath) {
				session.currentPath = event.path;
				session.events.push({
					type: 'move',
					path: event.path,
					time: Math.max(0, event.time - MOVE_DELAY_MS)
				});
			}

			// Record the event
			session.events.push(event);
		}
	}

	function startRecording(tabId) {
		console.log("Starting recording on tab " + tabId);
		sessions[tabId] = {
			startTime: Date.now(),
			path: '',
			events: []
		};
		setBrowserUI({
			tabId: tabId,
			title: 'Stop recording',
			badgeText: 'REC'
		});
		chrome.tabs.sendMessage(tabId, 'start');
	}

	function stopRecording(tabId) {
		var session = { events: sessions[tabId].events };
		chrome.tabs.sendMessage(tabId, 'stop');
		setBrowserUI({
			tabId: tabId,
			title: 'Start recording',
			badgeText: ''
		});
		sessions[tabId] = null;
		console.log("Stopped recording on tab " + tabId);
		console.log(session);
		Util.copy(JSON.stringify(session));
	}

	function setBrowserUI(options) {
		if (options.title !== undefined) {
			browserAction.setTitle({
				title: options.title,
				tabId: options.tabId
			});
		}
		if (options.badgeText !== undefined) {
			browserAction.setBadgeText({
				text: options.badgeText,
				tabId: options.tabId
			});
		}
		if (options.badgeBackgroundColor !== undefined) {
			browserAction.setBadgeBackgroundColor({
				color: options.badgeBackgroundColor,
				tabId: options.tabId
			});
		}
	}

	// Setup extension UI
	browserAction.setTitle({ title: 'Start recording' });
	browserAction.setBadgeBackgroundColor({ color: '#F00' });
	browserAction.onClicked.addListener(function (tab) {
		if (sessions[tab.id]) {
			stopRecording(tab.id);
		} else {
			startRecording(tab.id);
		}
	});

	// Setup message handlers
	Messages.addHandler('event', recordEvent);

})();