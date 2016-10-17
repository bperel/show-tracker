var casper = require('casper').create({
	pageSettings: {
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)'
	},
	viewportSize: {
		width: 1600,
		height: 1600
	}
});

var dates = casper.cli.options.dates.split(',');

var sites = [
	{
		name: 'viagogo',
		type: 'scraping',
		url: 'http://www.viagogo.co.uk/Theatre-Tickets/Theatre/Harry-Potter-and-the-Cursed-Child-Tickets'
	},
	{
		name: 'getmein',
		type: 'scraping',
		url: 'http://www.getmein.com/play/harry-potter-and-the-cursed-child-tickets.html'
	}
];

var nonProcessedDatesForIntegration;
var timesAndPrices;
var pagesProcessedPerIntegration = {};

function scrape(integrationName) {
	casper.then(function () {
		console.log("[Integration][" + integrationName + "] Scraping page " + pagesProcessedPerIntegration[integrationName]);
		timesAndPrices[integrationName] =
			this.evaluate(function (dates, timesAndPricesForIntegration) {
				console.log("[Integration][" + integration.name + "] Scraping state : " + integration.getNextDaysPaginationMarker());

				Array.prototype.forEach.call(dates, function (date) {
					Array.prototype.forEach.call(integration.getDayElements(date), function (dayElement) {
						console.log("[Integration][" + integration.name + "] Day found : " + date);
						timesAndPricesForIntegration.push(date);

						var showElementsInDayElement = integration.getShowElementsInDayElement(dayElement);
						if (showElementsInDayElement.length) {
							Array.prototype.forEach.call(showElementsInDayElement, function (showElement) {
								var timeAndPrice = integration.getTimeAndPriceForShowElement(showElement);
								if (timeAndPrice != null) {
									console.log("[Integration][" + integration.name + "][Show]" + date + " " + timeAndPrice.time.trim() + " : " + timeAndPrice.price.trim());
								}
							});
						}
					});
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
			else {
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
				return;
			}
		}
		sites.splice(0, 1);
		site = sites[0];
		grabNextSite();
	});
}

var initSite;

function grabNextSite() {
	initSite = false;
	timesAndPrices = {};

	casper.on("page.initialized", function(){

		timesAndPrices[site.name] = [];
		nonProcessedDatesForIntegration = dates;
		this.page.injectJs('node_modules/moment/moment.js');
		this.page.injectJs('node_modules/moment-timezone-with-data-2010-2020/index.js');
		this.page.injectJs('integrations/general.js');
		this.page.injectJs('integrations/'+site.name+'.js');
	});

	casper.on('load.finished', function() {
		if (!initSite) {
			initSite = true;
			console.log("[Integration][" + site.name + "] Starting");
			switch(site.type) {
				case 'scraping':
					pagesProcessedPerIntegration[site.name] = 0;
					scrape(site.name);
					break;
			}
		}
	});

	casper.start(site.url);

	casper.run(function() {
		casper.done();
	});
}

casper.on('remote.message', function(message) {
	console.log(message);
});

casper.on( 'page.error', function (msg, trace) {
	this.echo( 'Error: ' + msg + JSON.stringify(trace), 'ERROR' );
});

var site = sites[0];
grabNextSite();