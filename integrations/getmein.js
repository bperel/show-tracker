var integration =
{
	name: 'getmein',
	getDayElements: function(date) {
		var timezonedDate = getTimeZonedTime(date, 'Europe/London');
		var day = timezonedDate.format('DD');
		var monthAndYear = timezonedDate.format('MMM YYYY');
		var allDays = document.querySelectorAll('.date.table-cell');

		return Array.prototype.filter.call(allDays, function (dayElement) {
			return dayElement.querySelector('.day') === day
			 && dayElement.querySelector('.month-year.month') === monthAndYear;
		}).map(function(dayElement) {
			return dayElement.parentElement();
		});
	},
	getShowElementsInDayElement: function(dayElement) {
		return dayElement.querySelectorAll('.month-year:not(.month)');
	},
	getTimeAndPriceForShowElement: function(showElement) {
		return {
			time: showElement.textContent,
			price: 1
		}
	},
	getElementForNextDays: function() {
		return document.querySelector('#ctl00_centerContent_urcDomesticTickets_cmdNextTop');
	},
	getNextDaysPaginationMarker: function() {
		return document.querySelector('#ctl00_centerContent_urcDomesticTickets_lblPageCount').textContent;
	},
	hasChangedPagination: function(stateBefore) {
		var currentMonth = document.querySelector('.js-month').textContent;
		return currentMonth !== stateBefore && currentMonth.trim().match(/^[A-Za-z]+ [0-9]{4}$/);
	},
	getMaxPaginationChange: function() {
		return 12;
	},
	getMaxDay: function() {
		var allDays = document.querySelectorAll('.date.table-cell');
		var maxDay = null;

		Array.prototype.forEach.call(allDays, function (dayElement) {
			var date = dayElement.querySelector('.day').textContent + " " + dayElement.querySelector('.month-year.month');
			var currentDay = moment("DD MMM YYYY", date);
			if (!maxDay || maxDay.diff(currentDay) < 0) {
				maxDay = currentDay;
			}
		});
		return maxDay;
	}
};