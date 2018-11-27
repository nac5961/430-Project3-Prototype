"use strict";

//Function to send an AJAX request when a user updates their password
var handlePassword = function handlePassword(e) {
	//Prevent the form from submitting
	e.preventDefault();

	//Handle invalid input
	if ($("#oldPassword").val() === '' || $("#newPassword").val() === '' || $("#newPassword2").val() === '') {
		displayMessage("All fields are required");
		return false;
	} else if ($("#newPassword").val() !== $("#newPassword2").val()) {
		displayMessage("Passwords do not match");
		return false;
	}

	//Send the AJAX request
	sendAjax($("#password-form").attr("method"), $("#password-form").attr("action"), $("#password-form").serialize(), function (json) {
		//Clear the form
		clearForm();

		//Display message from the server
		displayMessage(json.message);
	});

	//Prevent the form from changing pages
	return false;
};

//Function to clear the form after a successful submission
var clearForm = function clearForm() {
	document.getElementById('oldPassword').value = '';
	document.getElementById('newPassword').value = '';
	document.getElementById('newPassword2').value = '';
};

//Function to setup event listeners
var setupUI = function setupUI() {
	var passwordForm = document.getElementById('password-form');

	passwordForm.onsubmit = function (e) {
		handlePassword(e);
	};
};

//Note: $(document).ready() is similar to window.onload = init;
//Setup event listeners when the page loads
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
