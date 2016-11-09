module.exports= {
	name: 'stubhub',
	getRestEventListCallEndpoint: function(parameters) {
		return 'https://api.stubhub.com/search/catalog/events/v3?' + encodeGetParameters(parameters);
	},
	getRestPriceListCallEndpoint: function(parameters) {
		return 'https://api.stubhub.com/search/inventory/v1?' + encodeGetParameters(parameters);
	},
	getRestCallOptions: function() {
		return {
			method: 'get',
			headers: {
				'Accept': 'application/json',
				'Accept-Encoding': 'application/json',
				'Cache-Control': 'no-cache',
				'Authorization': 'Bearer ' + config.integrations.stubhub.application_token
			}
		};
	},
	getParameters: function (date, eventName) {
		return {
			minAvailableTickets: '1',
			date: date + 'T00:00 TO ' + date + 'T23:59',
			name: eventName,
			rows: '20'
		};
	},
	getDayElements: function(date) {
		return Array.prototype.filter.call(jsonContent.events, function (event) {
			return event.eventDateLocal.indexOf(date) === 0;
		}).map(function(event) {
			return {eventId: event.id, eventDateLocal: event.eventDateLocal};
		});
	},
	getShowElementsInDayElement: function(parameters, callback) {
		casper.open(integration.getRestPriceListCallEndpoint(parameters), integration.getRestCallOptions());
		casper.then(function() {
			var jsonResponse = integration.parseJson(this.page.plainText, integration.name);
			callback((jsonResponse && jsonResponse.listing) || []);
		});
	},
	getTimeAndPriceForShowElement: function(event, show) {
		return {
			time: event.eventDateLocal.substr(11,5),
			price: "" + show.listingPrice.amount + " " + show.listingPrice.currency
		}
	},
	parseJson: function(str, integrationName) {
		try {
			return JSON.parse(str);
		} catch(e){
			console.log("[Integration][" + integrationName + "] Error while parsing JSON response : " + e);
			return null;
		}
	}
};