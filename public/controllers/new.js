require.config({
	baseUrl: "/"
});

require(["jquery", "libs/helper"], function($, Helper) {
	var h = new Helper;

	$(document).ready(function() {

		h.setUserAgent();

	});
});