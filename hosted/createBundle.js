"use strict";

//Function to send an AJAX request when a user creates or updates a payment
var handlePayment = function handlePayment(e) {
	//Prevent the form from submitting
	e.preventDefault();

	//Handle invalid input
	if ($("#name").val() === '' || $("#cost").val() === '' || $("#datepicker").val() === '') {
		displayMessage("All fields are required");
		return false;
	}

	//Send the AJAX request
	sendAjax($("#payment-form").attr("method"), $("#payment-form").attr("action"), $("#payment-form").serialize(), function (json) {
		//Clear the form if a payment was successfully created/updated
		if (json.success) {
			clearForm();
		}

		//Display message from the server
		displayMessage(json.message);
	});

	//Prevent the form from changing pages
	return false;
};

//Function to change the background image of the priority when the select is changed
var handlePriority = function handlePriority(e) {
	var priorityField = document.getElementById('priority');
	switchPriority(priorityField, e.target.value);
};

//Function to clear the form after a successful submission
var clearForm = function clearForm() {
	document.getElementById('name').value = '';
	document.getElementById('cost').value = '';
	document.getElementById('datepicker').value = '';

	var priorityField = document.getElementById('priority');
	switchPriority(priorityField, 'normal');
};

//Function to use React to dynamically create the payment form
var PaymentForm = function PaymentForm(props) {
	var costLabel = 'Cost';
	var dateLabel = 'Due Date';
	var priorityLabel = 'Priority';
	var submitLabel = 'Create Payment';
	var method = 'POST';
	var action = '/createPayment';

	//Change variables if this is the update form
	if (props.isUpdate) {
		costLabel = "Updated " + costLabel;
		dateLabel = "Updated " + dateLabel;
		priorityLabel = "Updated " + priorityLabel;
		submitLabel = 'Update Payment';
		method = 'PUT';
		action = '/updatePayment';
	}

	return React.createElement(
		"form",
		{ id: "payment-form", name: "payment-form",
			onSubmit: handlePayment,
			action: action,
			method: method },
		React.createElement(
			"label",
			{ htmlFor: "name" },
			"Payment"
		),
		React.createElement("input", { className: "input-button", type: "text", id: "name", name: "name", maxLength: "30", pattern: "^[a-zA-Z0-9]+( [a-zA-Z0-9]+)*$", title: "Please enter alphanumeric characters only; No trailing or leading spaces (Max: 30 characters)", placeholder: "Payment Name" }),
		React.createElement(
			"label",
			{ htmlFor: "cost" },
			costLabel
		),
		React.createElement("input", { className: "input-button", type: "number", id: "cost", name: "cost", step: "0.01", placeholder: "$Amount" }),
		React.createElement(
			"label",
			{ htmlFor: "dueDate" },
			dateLabel
		),
		React.createElement("input", { className: "input-button", id: "datepicker", name: "dueDate", placeholder: "MM/DD/YYYY" }),
		React.createElement(
			"label",
			{ htmlFor: "priority" },
			priorityLabel
		),
		React.createElement(
			"select",
			{ onChange: handlePriority, className: "input-button option-normal-priority", id: "priority", name: "priority" },
			React.createElement(
				"option",
				{ id: "high", value: "high" },
				"High"
			),
			React.createElement(
				"option",
				{ id: "normal", value: "normal", selected: true },
				"Normal"
			),
			React.createElement(
				"option",
				{ id: "low", value: "low" },
				"Low"
			)
		),
		React.createElement("input", { id: "csrfToken", type: "hidden", name: "_csrf", value: props.csrf }),
		React.createElement("input", { id: "payment-form-submit", className: "submit input-button", type: "submit", value: submitLabel })
	);
};

//Function to switch the active button
var switchActiveButton = function switchActiveButton(activeButton, inactiveButton) {
	//Make the active button active
	activeButton.classList.add('active-button');
	activeButton.classList.remove('inactive-button');

	//Make the inactive button inactive
	inactiveButton.classList.add('inactive-button');
	inactiveButton.classList.remove('active-button');
};

//Function to switch the background color of the priority
var switchPriority = function switchPriority(selectElement, type) {
	//Remove all priority classes
	selectElement.classList.remove('option-high-priority');
	selectElement.classList.remove('option-normal-priority');
	selectElement.classList.remove('option-low-priority');

	//Change the selected option
	document.getElementById(type).selected = true;

	//Assign the appropriate class
	switch (type) {
		case 'low':
			selectElement.classList.add('option-low-priority');
			break;
		case 'high':
			selectElement.classList.add('option-high-priority');
			break;
		case 'normal':
		default:
			selectElement.classList.add('option-normal-priority');
			break;
	}
};

//Function to make the datepicker functional
var setupDatepicker = function setupDatepicker() {
	$("#datepicker").datepicker({
		format: 'mm/dd/yyyy',
		todayHighlight: true,
		autoclose: true
	});
};

//Function to render forms and setup page links
var setupUI = function setupUI(csrf) {
	var createButton = document.getElementById('create-button');
	var updateButton = document.getElementById('update-button');

	//Event listener for create button
	createButton.onclick = function () {
		//Render create form
		ReactDOM.render(React.createElement(PaymentForm, { csrf: csrf }), document.getElementById("form-creation-content"));

		//Only clear the form if the button is inactive
		if (createButton.className === 'inactive-button') {
			clearForm();
		}

		//Make the create button active and the update button inactive
		switchActiveButton(createButton, updateButton);

		//Make the date picker functional
		setupDatepicker();
	};

	//Event listener for update button
	updateButton.onclick = function () {
		//Render update form
		ReactDOM.render(React.createElement(PaymentForm, { csrf: csrf, isUpdate: "true" }), document.getElementById("form-creation-content"));

		//Only clear the form if the button is inactive
		if (updateButton.className === 'inactive-button') {
			clearForm();
		}

		//Make the update button active and the create button inactive
		switchActiveButton(updateButton, createButton);

		//Make the date picker functional
		setupDatepicker();
	};

	sendAjax('GET', '/getTemp', null, function (temp) {
		//A temp payment was created - accessing create page from Edit
		if (temp.payment) {
			//Render update form
			ReactDOM.render(React.createElement(PaymentForm, { csrf: csrf, isUpdate: "true" }), document.getElementById("form-creation-content"));

			//Make the update button active and the create button inactive
			switchActiveButton(updateButton, createButton);

			//Get the input fields of the form
			var nameField = document.getElementById('name');
			var costField = document.getElementById('cost');
			var dateField = document.getElementById('datepicker');
			var priorityField = document.getElementById('priority');

			//Set the values to the payment
			nameField.value = temp.payment.name;
			costField.value = temp.payment.cost;
			dateField.value = moment(new Date(temp.payment.dueDate), 'MM-DD-YYYY').format('M/D/YYYY');
			switchPriority(priorityField, temp.payment.priority);

			//Get the csrfToken and turn it into JSON for the AJAX request
			var csrfToken = document.getElementById('csrfToken').value;
			var csrfTokenJSON = {
				_csrf: csrfToken
			};

			//Delete the temp payment, since we already extracted the data
			//Note: If the temp payment is not deleted, when we access the
			//create page normally, it will always act like we just clicked
			//the Edit button and auto-fill the form
			sendAjax('DELETE', '/removeTemp', csrfTokenJSON, null);
		}

		//No temp payment - Accessing the create page regularly
		else {
				//Render create form
				ReactDOM.render(React.createElement(PaymentForm, { csrf: csrf }), document.getElementById("form-creation-content"));
			}

		//Make the date picker functional
		setupDatepicker();
	});
};

//Note: $(document).ready() is similar to window.onload = init;
//Make a call to get the token and render the forms
//when the page loads
$(document).ready(function () {
	getToken(function (token) {
		setupUI(token.csrfToken);
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
