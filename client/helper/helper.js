//Function to display errors and other messages
const displayMessage = (message) => {
	const messageElement = document.getElementById('message');
	messageElement.textContent = message;
	
	$("#message").stop(true, true).fadeIn('slow').animate({opacity: 1}, 2000).fadeOut('slow');
};

//Function to redirect the user to another page or display a message
const redirect = (response) => {
	if (response.redirect){
		window.location = response.redirect;
	}
	else if (response.message){
		displayMessage(response.message);
	}
};

//Function to get a CSRF token from the server for security
const getToken = (callback) => {
	sendAjax('GET', '/getToken', null, callback);
};

//Function to send an AJAX request to the server
const sendAjax = (type, action, data, callback) => {
	$.ajax({
		cache: false,
		type: type,
		url: action,
		data: data,
		dataType: "json",
		success: (returnedJSON) => {
			callback(returnedJSON);
		},
		error: (xhr, status, error) => {
			if (xhr && xhr.status !== 200){
				const messageObj = JSON.parse(xhr.responseText);
				displayMessage(messageObj.error);
			}
		}
	});
};