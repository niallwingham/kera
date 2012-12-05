var Util;
(function (Util) {
	"use strict";

	function copy(text) {
		var textArea = document.createElement('textarea');
		document.body.appendChild(textArea);
		textArea.value = text;
		textArea.setSelectionRange(0, text.length);
		document.execCommand('copy');
		document.body.removeChild(textArea);
	}

	Util.copy = copy;

})(Util || (Util = {}));