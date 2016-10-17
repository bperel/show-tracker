var casper = require('casper').create({
	clientScripts:  [
		'integrations/general.js',
		'node_modules/moment/moment.js',
		'node_modules/moment-timezone-with-data-2010-2020/index.js'
	],
	pageSettings: {
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)'
	},
	viewportSize: {
		width: 1600,
		height: 1600
	}
});

var dates = casper.cli.options.dates.split(',');

var sites = [{
	name: 'viagogo',
	type: 'scraping',
	url: 'http://www.viagogo.co.uk/Theatre-Tickets/Theatre/Harry-Potter-and-the-Cursed-Child-Tickets'
}];

var nonProcessedDatesForIntegration;
var timesAndPrices;
var pagesProcessedPerIntegration = {};

function scrape(integrationName) {
	casper.then(function () {
		timesAndPrices[integrationName] =
			this.evaluate(function (dates, timesAndPricesForIntegration) {
				console.log("[Integration][" + integration.name + "] Scraping state : " + integration.getNextDaysPaginationMarker());

				Array.prototype.forEach.call(dates, function (date) {
					var dayElement = integration.getDayElement(date);
					if (dayElement) {
						console.log("[Integration][" + integration.name + "] Day found : " + date);
						timesAndPricesForIntegration.push(date);

						var showElementsInDayElement = integration.getShowElementsinDayElement(dayElement);
						if (showElementsInDayElement.length) {

							Array.prototype.forEach.call(showElementsInDayElement, function (showElement) {
								var timeAndPrice = integration.getTimeAndPriceForShowElement(showElement);
								if (timeAndPrice != null) {
									console.log("[Integration][" + integration.name + "][Show]" + date + " " + timeAndPrice.time.trim() + " : " + timeAndPrice.price.trim());
								}
							});
						}
					}
				});
				return timesAndPricesForIntegration;
			}, nonProcessedDatesForIntegration, timesAndPrices[integrationName]
		);
		var maxDayDisplayed = this.evaluate(function () {
			return integration.getMaxDay().format('YYYY-MM-DD');
		});

		for (var j = nonProcessedDatesForIntegration.length - 1; j >= 0; j--) {
			var date = nonProcessedDatesForIntegration[j];
			if (timesAndPrices[integrationName].indexOf(date) === -1) {
				if (maxDayDisplayed > date) {
					console.log("[Integration][" + integrationName + "] Day not found in the calendar : " + date + ", skipping date.");
				}
				else {
					console.log("[Integration][" + integrationName + "] Day not found : " + date + ", will fetch next show dates");
					continue;
				}
			}
			nonProcessedDatesForIntegration.splice(j, 1); // Day processed or not found in calendar at all
		}

		if (nonProcessedDatesForIntegration.length) {
			pagesProcessedPerIntegration[integrationName]++;
			var maxPaginationChange = this.evaluate(function() {
				return integration.getMaxPaginationChange();
			});

			if (pagesProcessedPerIntegration[integrationName] >= maxPaginationChange) {
				console.log("[Integration][" + integrationName + "] Reached max pagination change : " + pagesProcessedPerIntegration[integrationName] + ", aborting.");
			}

			console.log("[Integration][" + integrationName + "] Fetching next show dates...");
			var stateBeforeNextDaysClick = this.evaluate(function () {
				var stateBeforeNextDaysClick = integration.getNextDaysPaginationMarker();
				integration.getElementForNextDays().click();

				return stateBeforeNextDaysClick;
			});

			casper.waitFor(function () {
				return this.evaluate(function (stateBeforeNextDaysClick) {
					return integration.hasChangedPagination(stateBeforeNextDaysClick);
				}, stateBeforeNextDaysClick);
			}, function then() {
				scrape(integrationName);
			});
		}
	});
}

for (i in sites) {
	var site = sites[i];
	timesAndPrices = {};

	casper.on('remote.message', function(message) {
		console.log(message);
	});casper.on( 'page.error', function (msg, trace) {
		this.echo( 'Error: ' + msg + JSON.stringify(trace), 'ERROR' );
	});

	casper.start(site.url, function() {
		timesAndPrices[site.name] = [];
		nonProcessedDatesForIntegration = dates;
		this.page.injectJs('integrations/'+site.name+'.js');

		switch(site.type) {
			case 'scraping':
				pagesProcessedPerIntegration[site.name] = 0;
				scrape(site.name);
			break;
		}
	});

	casper.run(function() {
		casper.done();
	});
}