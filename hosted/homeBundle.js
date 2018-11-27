"use strict";

// Function to send an AJAX request when the user logs in
var handleLogin = function handleLogin(e) {
	//Prevent the form from submitting
	e.preventDefault();

	//Validate input
	if ($("#username").val() === '' || $("#password").val() === '') {
		displayMessage("Username or Password is empty");
		return false;
	}

	//Send the AJAX request
	sendAjax($("#home-form").attr("method"), $("#home-form").attr("action"), $("#home-form").serialize(), redirect);

	//Prevent the form from changing pages
	return false;
};

// Function to send an AJAX request when the user signs up
var handleSignup = function handleSignup(e) {
	//Prevent the form from submitting
	e.preventDefault();

	//Validate input
	if ($("#username").val() === '' || $("#password").val() === '' || $("#password2").val() === '') {
		displayMessage("All fields are required");
		return false;
	} else if ($("#password").val() !== $("#password2").val()) {
		displayMessage("Passwords do not match");
		return false;
	}

	//Send the AJAX request
	sendAjax($("#home-form").attr("method"), $("#home-form").attr("action"), $("#home-form").serialize(), redirect);

	//Prevent the form from changing pages
	return false;
};

//Function to use React to dynamically create the login form
var LoginForm = function LoginForm(props) {
	return React.createElement(
		"div",
		null,
		React.createElement(
			"h1",
			null,
			"Login"
		),
		React.createElement(
			"form",
			{ id: "home-form", name: "home-form",
				onSubmit: handleLogin,
				action: "/login",
				method: "POST" },
			React.createElement("input", { className: "input-button", id: "username", type: "text", name: "username", placeholder: "Username" }),
			React.createElement("input", { className: "input-button", id: "password", type: "password", name: "password", placeholder: "Password" }),
			React.createElement("input", { type: "hidden", name: "_csrf", value: props.csrf }),
			React.createElement("input", { className: "submit input-button", type: "submit", value: "Sign In" })
		),
		React.createElement(
			"p",
			{ id: "toSignup" },
			"Don't have an account? Sign Up"
		)
	);
};

//Function to use React to dynamically create the signup form
var SignupForm = function SignupForm(props) {
	return React.createElement(
		"div",
		null,
		React.createElement(
			"h1",
			null,
			"Sign Up"
		),
		React.createElement(
			"form",
			{ id: "home-form", name: "home-form",
				onSubmit: handleSignup,
				action: "/signup",
				method: "POST" },
			React.createElement("input", { className: "input-button", id: "username", type: "text", name: "username", placeholder: "Username" }),
			React.createElement("input", { className: "input-button", id: "password", type: "password", name: "password", placeholder: "Password" }),
			React.createElement("input", { className: "input-button", id: "password2", type: "password", name: "password2", placeholder: "Re-type Password" }),
			React.createElement("input", { type: "hidden", name: "_csrf", value: props.csrf }),
			React.createElement("input", { className: "submit input-button", type: "submit", value: "Sign Up" })
		),
		React.createElement(
			"p",
			{ id: "toLogin" },
			"Already have an account? Log in"
		)
	);
};

//Function to render the login form to the page
var renderLoginForm = function renderLoginForm(csrf) {
	ReactDOM.render(React.createElement(LoginForm, { csrf: csrf }), document.getElementById("home-content"));

	//Setup link to switch forms
	document.getElementById("toSignup").onclick = function () {
		renderSignupForm(csrf);
	};
};

//Function to render the signup form to the page
var renderSignupForm = function renderSignupForm(csrf) {
	ReactDOM.render(React.createElement(SignupForm, { csrf: csrf }), document.getElementById("home-content"));

	//Setup link to switch forms
	document.getElementById("toLogin").onclick = function () {
		renderLoginForm(csrf);
	};
};

//Function to render the default form shown when going to
//the home page
var setupDefaultView = function setupDefaultView(csrf) {
	renderSignupForm(csrf);
};

//Note: $(document).ready() is similar to window.onload = init;
//Make a call to get the token and render the forms
//when the page loads
$(document).ready(function () {
	getToken(function (token) {
		setupDefaultView(token.csrfToken);
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
