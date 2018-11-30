"use strict";

//Function to send an AJAX request when a user submits a search
var handleSearch = function handleSearch(e) {
	//Prevent the form from submitting
	e.preventDefault();

	//If a blank search load all payments
	if ($("#search-bar").val() === '') {
		loadAllPayments();
		return false;
	}

	//Send the AJAX request
	sendAjax($("#search").attr("method"), $("#search").attr("action"), $("#search").serialize(), function (json) {
		renderPayments(json);
	});

	//Prevent the form from changing pages
	return false;
};

//Function to send an AJAX request when a user clicks edit
var handleEdit = function handleEdit(e) {
	//Get the index of the payment (index from display order)
	var index = e.target.value;

	//Get the name of the payment based off the index (id is 'paymentNameIndex' + index)
	var paymentName = document.getElementById("paymentNameIndex" + index).textContent;

	//Get the csrfToken from the page
	var csrfToken = document.getElementById('csrfToken').value;

	//Create data to send to the server to perform the edit
	var data = {
		name: paymentName,
		_csrf: csrfToken
	};

	//Send the AJAX request
	sendAjax('POST', '/createTemp', data, redirect);
};

//Function to send an AJAX request when a user clicks delete
var handleDelete = function handleDelete(e) {
	//Get the index of the payment (index from display order)
	var index = e.target.value;

	//Get the name of the payment based off the index (id is 'paymentNameIndex' + index)
	var paymentName = document.getElementById("paymentNameIndex" + index).textContent;

	//Get the csrfToken from the page
	var csrfToken = document.getElementById('csrfToken').value;

	//Create data to send to the server to perform the delete
	var data = {
		name: paymentName,
		_csrf: csrfToken
	};

	//Send the AJAX request
	sendAjax('DELETE', '/removePayment', data, function (json) {
		//Display the message from the server
		displayMessage(json.message);

		//Show the new set of data but call the filter
		//method just in case a filter was being used
		filterPayments();
	});
};

//Function to make an AJAX request to get a filtered list of payments from the server
var filterPayments = function filterPayments() {
	sendAjax('GET', '/filter', $("#filter-form").serialize(), function (filteredPayments) {
		renderPayments(filteredPayments);
	});
};

//Function to make an AJAX request to get all the payments from the server
var loadAllPayments = function loadAllPayments() {
	sendAjax('GET', '/getPayments', null, function (allPayments) {
		renderPayments(allPayments);
	});
};

//Function to render the payments
var renderPayments = function renderPayments(result) {
	ReactDOM.render(React.createElement(PaymentList, { payments: result.payments }), document.getElementById('results-content'));
};

//Function to dynamically create the UI for displaying the payments
var PaymentList = function PaymentList(props) {
	var payments = props.payments;

	//Render UI that says no payments were found
	if (!payments || payments.length === 0) {
		return React.createElement(
			"div",
			null,
			React.createElement(
				"h3",
				{ id: "not-found", className: "highlight" },
				"No payments were found"
			)
		);
	}

	var index = 0;
	var paymentNameId = 'paymentNameIndex';

	//Get today and tomorrow's date
	var today = moment();
	var tomorrow = moment().add(1, 'days');

	//Use array.map to create UI for each payment
	var paymentNodes = payments.map(function (payment) {
		index++;

		//Variables to show time display to user
		var timeLeft = void 0;
		var timeIcon = void 0;

		//Set the src for the priority icon
		var src = "/assets/img/" + payment.priority + "-priority-icon.png";

		//Set the id to use for the name
		var nameId = "" + paymentNameId + index;

		//Convert the returned date to moment
		var dueDate = moment(new Date(payment.dueDate), 'MM-DD-YYYY');
		var dueDateString = dueDate.format('M/D/YY');

		//Today
		if (dueDate.isSame(today, 'day')) {
			timeLeft = 'Today';
			timeIcon = 'clock-icon';
		}

		//Overdue
		else if (!dueDate.isAfter(today, 'day')) {
				timeLeft = 'Overdue';
				timeIcon = 'overdue-icon';
			}

			//Due Tomorrow
			else if (dueDate.isSame(tomorrow, 'day')) {
					timeLeft = 'Tomorrow';
					timeIcon = 'clock-icon';
				}

				//Due in 2 or more days
				else {
						//Calculate the number of days from today to the due date
						var timeBetweenDays = dueDate.diff(today, 'days') + 1;

						timeLeft = "Due in " + timeBetweenDays + " days";
						timeIcon = 'clock-icon';
					}

		return React.createElement(
			"div",
			{ className: "payment" },
			React.createElement(
				"div",
				{ className: "payment-priority" },
				React.createElement("img", { src: src, alt: payment.priority })
			),
			React.createElement(
				"h3",
				{ id: nameId, className: "payment-name highlight" },
				payment.name
			),
			React.createElement(
				"h3",
				{ className: "payment-cost highlight" },
				"$",
				payment.cost
			),
			React.createElement(
				"div",
				{ className: "payment-icons-container" },
				React.createElement(
					"ul",
					{ className: "date-icons" },
					React.createElement(
						"li",
						{ className: "calendar-icon" },
						dueDateString
					),
					React.createElement(
						"li",
						{ className: timeIcon },
						timeLeft
					)
				),
				React.createElement(
					"ul",
					{ className: "options-icons" },
					React.createElement(
						"li",
						{ onClick: handleEdit, value: index, className: "edit-icon" },
						"Edit"
					),
					React.createElement(
						"li",
						{ onClick: handleDelete, value: index, className: "delete-icon" },
						"Delete"
					)
				)
			)
		);
	});

	//Render the list we just created
	return React.createElement(
		"div",
		null,
		paymentNodes
	);
};

//Function to render forms and setup event listeners
var setupUI = function setupUI() {
	//Get reference to forms
	var searchForm = document.getElementById('search');
	var multiFilters = document.getElementsByClassName('multi-filter');
	var singleFilters = document.getElementsByClassName('single-filter');

	//Event listener for search form
	searchForm.onsubmit = function (e) {
		//Get all the checkboxes from the filter
		var checkboxes = document.getElementsByClassName('filter-input');

		//Uncheck all checkboxes since the search doesn't take the filter into account
		for (var i = 0; i < checkboxes.length; i++) {
			checkboxes[i].checked = false;
		}

		//Apply the search
		handleSearch(e);
	};

	//Event listener for Date section of filter
	//multi-filter means it can be used with other filters
	//in the same section
	for (var i = 0; i < multiFilters.length; i++) {
		var filter = multiFilters[i];

		filter.onchange = function () {
			//Clear the search bar
			document.getElementById('search-bar').value = '';

			//Perform the filter
			filterPayments();
		};
	}

	//Event listener for every other section of filter
	//single-filter means it cannot be used with other filters
	//in the same section
	for (var _i = 0; _i < singleFilters.length; _i++) {
		var _filter = singleFilters[_i];

		_filter.onchange = function (e) {
			//Uncheck all single-filters except for this one
			for (var j = 0; j < singleFilters.length; j++) {
				var otherFilter = singleFilters[j];

				if (e.target === otherFilter) continue;

				otherFilter.checked = false;
			}

			//Clear the search bar
			document.getElementById('search-bar').value = '';

			//Apply the filter
			filterPayments();
		};
	}

	//Load all the payments from the server (default view on page load)
	loadAllPayments();
};

//Note: $(document).ready() is similar to window.onload = init;
//Setup event listeners and display payments when page loads
$(document).ready(function () {
	setupUI();
});
'use strict';

//Function to display errors and other messages
var displayMessage = function displayMessage(message) {
	var messageElement = document.getElementById('message');
	messageElement.textContent = message;

	$("#message").stop(true, true).fadeIn('slow').animate({ opacity: 1 }, 2000).fadeOut('slow');
};

//Function to redirect the user to another page or display a message
var redirect = function redirect(response) {
	if (response.redirect) {
		window.location = response.redirect;
	} else if (response.message) {
		displayMessage(response.message);
	}
};

//Function to get a CSRF token from the server for security
var getToken = function getToken(callback) {
	sendAjax('GET', '/getToken', null, callback);
};

//Function to send an AJAX request to the server
var sendAjax = function sendAjax(type, action, data, callback) {
	$.ajax({
		cache: false,
		type: type,
		url: action,
		data: data,
		dataType: "json",
		success: function success(returnedJSON) {
			callback(returnedJSON);
		},
		error: function error(xhr, status, _error) {
			if (xhr && xhr.status !== 200) {
				var messageObj = JSON.parse(xhr.responseText);
				displayMessage(messageObj.error);
			}
		}
	});
};
