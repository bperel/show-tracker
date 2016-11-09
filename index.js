function encodeGetParameters(obj) {
	return Object.keys(obj).map(function (key) {
		return key + '=' + encodeURIComponent(obj[key]);
	}).join('&');
}

function buildSites() {
	Array.prototype.forEach.call(urls, function (url) {
		var integrationAndConfig = url.split(':');
		if (integrationAndConfig.length !== 2) {
			console.error('Invalid URL ' + url + ', use format integration_site:page');
		}
		else {
			var sitesForUrl = Array.prototype.filter.call(sitesConfig, function (site) {
				return site.name === integrationAndConfig[0];
			});
			if (sitesForUrl) {
				var siteForUrl = sitesForUrl[0];
				var site = {
					name: siteForUrl.name,
					type: siteForUrl.type
				};
				switch(siteForUrl.type) {
					case 'scraping':
						site.url = siteForUrl.urlPrefix + integrationAndConfig[1];
					break;
					case 'api':
						site.eventName = integrationAndConfig[1];
					break;
				}
				sites.push(site);
			}
			else {
				console.error('Integration not found for name ' + integrationAndConfig[0]);
			}
		}
	});
}

function scrape(integrationName) {
	casper.then(function () {
		console.log("[Integration][" + integrationName + "] Scraping page " + pagesProcessedPerIntegration[integrationName]);
		timesAndPrices[integrationName] =
			this.evaluate(function (dates, timesAndPricesForIntegration) {
					console.log("[Integration][" + integration.name + "] Scraping state : " + integration.getNextDaysPaginationMarker());
					return findTimesAndPricesForIntegration(dates, timesAndPricesForIntegration);

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
					return integration.getNextDaysPaginationMarker();
				});

				casper.waitFor(function () {
					casper.captureSelector('yoursitelist.png', '.head');
					return this.evaluate(function (stateBeforeNextDaysClick) {
						return integration.hasChangedPagination(stateBeforeNextDaysClick);
					}, stateBeforeNextDaysClick);
				}, function() {
					scrape(integrationName);
				}, function() {
					console.log("[Integration][" + integrationName + "] Pagination change timeout, skipping integration.");
					sites.splice(0, 1);
					grabNextSite();
				});
				return;
			}
		}
		sites.splice(0, 1);
		grabNextSite();
	});
}

function findTimesAndPricesForIntegrationNextDate(integrationName, currentDateIndex) {
	var parameters = integration.getParameters(dates[currentDateIndex], currentSite.eventName);
	casper.open(integration.getRestEventListCallEndpoint(parameters), integration.getRestCallOptions());
	casper.then(function(response) {
		if(response.status == 200) {
			jsonContent = JSON.parse(this.page.plainText);
			findTimesAndPricesForIntegration([nonProcessedDatesForIntegration[currentDateIndex]], timesAndPrices[integrationName], function() {
				if (nonProcessedDatesForIntegration[currentDateIndex + 1]) {
					findTimesAndPricesForIntegrationNextDate(integrationName, currentDateIndex + 1);
				}
				else {
					sites.splice(0, 1);
					grabNextSite();
				}
			});
		}
		else {
			console.log("[Integration][" + integrationName + "] Error: HTTP error " + response.status + ", skipping integration");
			sites.splice(0, 1);
			grabNextSite();
		}
	});
}

function useApi(integrationName) {
	console.log("[Integration][" + integrationName + "] Using API");
	findTimesAndPricesForIntegrationNextDate(integrationName, 0);
}

function onLoad() {
	if (!siteInitDone) {
		siteInitDone = true;
		console.log("[Integration][" + currentSite.name + "] Starting");
		switch(currentSite.type) {
			case 'scraping':
				pagesProcessedPerIntegration[currentSite.name] = 0;
				scrape(currentSite.name);
				break;
			case 'api':
				useApi(currentSite.name);
				break;
		}
	}
}

function grabNextSite() {
	siteInitDone = false;
	currentSite = sites[0];

	timesAndPrices = {};

	casper.on("page.initialized", function() {
		timesAndPrices[currentSite.name] = [];
		nonProcessedDatesForIntegration = JSON.parse(JSON.stringify(dates));

		switch(currentSite.type) {
			case 'scraping':
				this.page.injectJs('node_modules/moment/moment.js');
				this.page.injectJs('node_modules/moment-timezone-with-data-2010-2020/index.js');
				this.page.injectJs('integrations/general.js');
				this.page.injectJs('integrations/'+currentSite.name+'.js');
			break;
		}
	});

	switch(currentSite.type) {
		case 'scraping':
			casper.on('load.finished', onLoad);
			casper.start(currentSite.url);
		break;
		case 'api':
			require('./integrations/general.js');
			integration = require('./integrations/' + currentSite.name + '.js');
			casper.start();
			onLoad();
		break;
	}

	casper.run(function() {
		setTimeout(function() {
			casper.done();
			phantom.exit();
		});
	});
}

var casper = require('casper').create({
	pageSettings: {
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)'
	},
	viewportSize: {
		width: 1600,
		height: 1600
	}
});
var config = require('config.json');
var findTimesAndPricesForIntegration = require('./integrations/general.js').findTimesAndPricesForIntegration;

casper.on('remote.message', function(message) {
	console.log(message);
});

casper.on( 'page.error', function (msg, trace) {
	this.echo( 'Error: ' + msg + JSON.stringify(trace), 'ERROR' );
});

var dates = casper.cli.options.dates.split(',');
var urls = casper.cli.options.sites.split(',');

var sitesConfig = [
	{
		name: 'viagogo',
		type: 'scraping',
		urlPrefix: 'http://www.viagogo.co.uk/Theatre-Tickets/Theatre/'
	},
	{
		name: 'getmein',
		type: 'scraping',
		urlPrefix: 'http://www.getmein.com/play/'
	},
	{
		name: 'stubhub',
		type: 'api',
		urlPrefix: 'https://api.stubhub.com/'
	}
];

var sites = [];
buildSites();

var nonProcessedDatesForIntegration;
var timesAndPrices;
var pagesProcessedPerIntegration = {}; // Scrape only
var jsonContent = null; // API only
var integration; // Local, API only
var moment;

var currentSite;
var siteInitDone = false;
grabNextSite();