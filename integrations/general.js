function getTimeZonedTime(date, timezone) {
	var m = moment.tz(date, 'YYYY-MM-DD', timezone);
	if (m.isDST()) {
		m.add(1, "hour");
	}
	return m;
}

function click(el){ // For PhantomJS < 2
	var ev = document.createEvent("MouseEvent");
	ev.initMouseEvent(
		"click",
		true /* bubble */, true /* cancelable */,
		window, null,
		0, 0, 0, 0, /* coordinates */
		false, false, false, false, /* modifier keys */
		0 /*left*/, null
	);
	el.dispatchEvent(ev);
}

function findTimesAndPricesForIntegration(dates, timesAndPricesForIntegration, callback) {
	Array.prototype.forEach.call(dates, function (date) {
		var dayElements = integration.getDayElements(date);
		Array.prototype.forEach.call(dayElements, function (dayElement) {
			console.log("[Integration][" + integration.name + "] Day found : " + date);
			timesAndPricesForIntegration.push(date);

			integration.getShowElementsInDayElement(dayElement, function(showElementsInDayElement) {
				if (showElementsInDayElement.length) {
					Array.prototype.forEach.call(showElementsInDayElement, function (showElement) {
						var timeAndPrice = integration.getTimeAndPriceForShowElement(dayElement, showElement);
						if (timeAndPrice != null) {
							console.log("[Integration][" + integration.name + "][Show]" + date + " " + timeAndPrice.time.trim() + " : " + timeAndPrice.price.trim());
						}
					});
				}
				callback && callback();
			});
		});
		if (dayElements.length === 0) {
			console.log("[Integration][" + integration.name + "] Day not found in the calendar : " + date);
			callback && callback();
		}
	});
	return timesAndPricesForIntegration;
}

if (!module) {
	var module = {};
}
if (!module.exports) {
	module.exports = {};
}
module.exports.findTimesAndPricesForIntegration = findTimesAndPricesForIntegration;