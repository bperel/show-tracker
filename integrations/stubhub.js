module.exports= {
	getParameters: function (dates, eventName) {
		return {
			minAvailableTickets: '1',
			date: '2017-01-08T00:00 TO 2017-01-12T23:59', // stub
			name: eventName,
			rows: '20'
		};
	}
};