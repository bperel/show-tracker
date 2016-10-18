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