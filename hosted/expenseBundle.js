'use strict';

//Function to send an AJAX request when the user changes the selected month
var handleSelect = function handleSelect(e) {
	//Clear the displayed data
	if (e.target.value === 'none') {
		clearData();
	}

	//Get data to display
	else {
			//Create a filter to get payments ordered by their date
			var filterData = {
				date: ['overdue', 'today', 'tomorrow', 'later']
			};

			//Get the filtered list and render them
			sendAjax('GET', '/filter', filterData, function (filteredPayments) {
				renderPayments(filteredPayments);
			});
		}
};

//Function to clear the displayed data
var clearData = function clearData() {
	//Clear the list of data
	document.getElementById('expenses').innerHTML = '';

	//Clear the cost
	document.getElementById('expense-total').textContent = '$0';

	//Clear the graph
	Plotly.purge('graph');
};

//Function to render the payments for the specific month
var renderPayments = function renderPayments(result) {
	ReactDOM.render(React.createElement(PaymentList, { payments: result.payments }), document.getElementById('expenses'));
};

//Function to render the months for the select element
var renderMonths = function renderMonths(result) {
	ReactDOM.render(React.createElement(MonthList, { payments: result.payments }), document.getElementById('expense-options'));
};

//Function to dynamically display the payments for the selected month
var PaymentList = function PaymentList(props) {
	var total = 0;
	var paymentNodes = [];
	var paymentCosts = [];
	var paymentDates = [];
	var payments = props.payments;
	var selectedMonth = document.querySelector('select').value;

	for (var i = 0; i < payments.length; i++) {
		//Get the current payment
		var payment = payments[i];

		//Convert the returned date to a string
		var dueDate = moment(new Date(payment.dueDate), 'MM-DD-YYYY');
		var dueDateString = dueDate.format('MMMM YYYY').toLowerCase();
		var dueDateDisplayString = dueDate.format('M/D/YY');
		var dueDateGraphString = dueDate.format('YYYY-MM-DD');

		//Store the payments that match the selected month
		if (dueDateString === selectedMonth) {
			//Increase the total
			total += payment.cost;

			//Add the payment data to graph
			paymentCosts.push(total);
			paymentDates.push(dueDateGraphString);

			//Set the src for the priority
			var src = '/assets/img/' + payment.priority + '-priority-icon.png';

			//Format the priority to have the first letter uppercased
			var upperLetter = payment.priority.charAt(0).toUpperCase();
			var afterFirstLetter = payment.priority.substr(1);

			var formattedPriority = '' + upperLetter + afterFirstLetter;

			//Create the HTML
			paymentNodes.push(React.createElement(
				'div',
				{ className: 'expenses' },
				React.createElement(
					'p',
					{ className: 'expense-name' },
					payment.name
				),
				React.createElement(
					'p',
					{ className: 'expense-cost' },
					'$',
					payment.cost
				),
				React.createElement(
					'p',
					{ className: 'expense-date' },
					dueDateDisplayString
				),
				React.createElement(
					'p',
					{ className: 'expense-priority' },
					React.createElement('img', { src: src, alt: payment.priority }),
					formattedPriority
				)
			));
		}
	}

	//Set the total cost
	document.getElementById('expense-total').textContent = '$' + total;

	//Create the graph
	createGraph(paymentCosts, paymentDates);

	return React.createElement(
		'div',
		null,
		paymentNodes
	);
};

//Function to dynamically create the options for the select element
var MonthList = function MonthList(props) {
	var months = [];
	var optionNodes = [];
	var payments = props.payments;

	for (var i = 0; i < payments.length; i++) {
		//Get the current payment
		var payment = payments[i];

		//Convert the returned date to a string
		var dueDate = moment(new Date(payment.dueDate), 'MM-DD-YYYY');
		var dueDateString = dueDate.format('MMMM YYYY');
		var dueDateStringLow = dueDateString.toLowerCase();

		//Add the month if this is the first time we've seen it and
		//create the options node
		if (!months.includes(dueDateStringLow)) {
			months.push(dueDateStringLow);

			optionNodes.push(React.createElement(
				'option',
				{ value: dueDateStringLow },
				dueDateString
			));
		}
	}

	return React.createElement(
		'select',
		{ onChange: handleSelect },
		React.createElement(
			'option',
			{ value: 'none' },
			'None'
		),
		optionNodes
	);
};

//Function to graph the payments
var createGraph = function createGraph(costArr, dateArr) {
	//Get the month and year from the dates to use for the title
	var title = moment(dateArr[0]).format('MMMM YYYY');

	//Set the data for the graph
	var data = [{
		x: dateArr,
		y: costArr,
		type: 'scatter',
		mode: 'lines+markers',
		line: { color: '#71c0cf' }
	}];

	//Set the layout for the graph
	var layout = {
		title: title + ' Expenses',
		titlefont: {
			color: '#4894a3'
		},
		xaxis: {
			type: 'date',
			ticks: 'outside',
			tickformat: '%m/%d'
		},
		yaxis: {
			autorange: true,
			type: 'linear'
		}
	};

	//Set the config for the graph
	var config = {
		responsive: true,
		displayModeBar: false
	};

	//Plot the data
	Plotly.newPlot('graph', data, layout, config);
};

//Function to setup the select element
var setupUI = function setupUI(jsonData) {
	renderMonths(jsonData);
};

//Note: $(document).ready() is similar to window.onload = init;
//Setup event listeners and display payments when page loads
$(document).ready(function () {
	sendAjax('GET', '/getPayments', null, function (allPayments) {
		setupUI(allPayments);
	});
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
