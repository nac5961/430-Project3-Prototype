//Function to send an AJAX request when a user updates their password
const handlePassword = (e) => {
	//Prevent the form from submitting
	e.preventDefault();
	
	//Handle invalid input
	if ($("#oldPassword").val() === '' || $("#newPassword").val() === '' || $("#newPassword2").val() === ''){
		displayMessage("All fields are required");
		return false;
	}
	else if ($("#newPassword").val() !== $("#newPassword2").val()){
		displayMessage("Passwords do not match");
		return false;
	}
	
	//Send the AJAX request
	sendAjax($("#password-form").attr("method"), $("#password-form").attr("action"), $("#password-form").serialize(), (json) => {
		//Clear the form
		clearForm();
		
		//Display message from the server
		displayMessage(json.message);
	});
	
	//Prevent the form from changing pages
	return false;
};

//Function to clear the form after a successful submission
const clearForm = () => {
	document.getElementById('oldPassword').value = '';
	document.getElementById('newPassword').value = '';
	document.getElementById('newPassword2').value = '';
};

//Function to setup event listeners
const setupUI = () => {
	const passwordForm = document.getElementById('password-form');
	
	passwordForm.onsubmit = (e) => {
		handlePassword(e);
	};
};

//Note: $(document).ready() is similar to window.onload = init;
//Setup event listeners when the page loads
$(document).ready(() => {
	setupUI();
});