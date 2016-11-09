var integration =
{
	name: 'viagogo',
	getDayElements: function(date) {
		var timezonedDate = getTimeZonedTime(date, 'Europe/London');
		return document.querySelectorAll('.js-day.day[id=\''+timezonedDate.unix()+'\']');
	},
	getShowElementsInDayElement: function(dayElement, callback) {
		callback(dayElement.querySelectorAll('.event.js-event'));
	},
	getTimeAndPriceForShowElement: function(dayElement, showElement) {
		var time = showElement.querySelector('.time');
		if (!time.nextElementSibling) {
			return null;
		}
		return {
			time: time.textContent,
			price: time.nextElementSibling.textContent
		}
	},
	getElementForNextDays: function() {
		return '.js-next-month';
	},
	getNextDaysPaginationMarker: function() {
		return document.querySelector('.js-month') && document.querySelector('.js-month').textContent;
	},
	hasChangedPagination: function(stateBefore) {
		var currentMonth = document.querySelector('.js-month').textContent;
		return currentMonth !== stateBefore && currentMonth.trim().match(/^[A-Za-z]+ [0-9]{4}$/);
	},
	getMaxPaginationChange: function() {
		return 12;
	},
	getMaxDay: function() {
		var allDays = document.querySelectorAll('.js-day.day');
		var maxDay = null;
		Array.prototype.forEach.call(allDays, function (day) {
			var currentDay = moment.unix(day.getAttribute('id')).tz('Europe/London');
			if (!maxDay || maxDay.diff(currentDay) < 0) {
				maxDay = currentDay;
			}
		});
		return maxDay;
	}
};