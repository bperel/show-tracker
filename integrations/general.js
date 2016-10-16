function getTimeZonedTime(date, timezone) {
	var m = moment.tz(date, 'YYYY-MM-DD', timezone);
	if (m.isDST()) {
		m.add(1, "hour");
	}
	return m;
}