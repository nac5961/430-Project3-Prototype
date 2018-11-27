// Function to send an AJAX request when the user logs in
const handleLogin = (e) => {
	//Prevent the form from submitting
	e.preventDefault();
	
	//Validate input
	if ($("#username").val() === '' || $("#password").val() === ''){
		displayMessage("Username or Password is empty");
		return false;
	}
	
	//Send the AJAX request
	sendAjax($("#home-form").attr("method"), $("#home-form").attr("action"), $("#home-form").serialize(), redirect);
	
	//Prevent the form from changing pages
	return false;
};

// Function to send an AJAX request when the user signs up
const handleSignup = (e) => {
	//Prevent the form from submitting
	e.preventDefault();
	
	//Validate input
	if ($("#username").val() === '' || $("#password").val() === '' || $("#password2").val() === ''){
		displayMessage("All fields are required");
		return false;
	}
	else if ($("#password").val() !== $("#password2").val()){
		displayMessage("Passwords do not match");
		return false;
	}
	
	//Send the AJAX request
	sendAjax($("#home-form").attr("method"), $("#home-form").attr("action"), $("#home-form").serialize(), redirect);
	
	//Prevent the form from changing pages
	return false;
};

//Function to use React to dynamically create the login form
const LoginForm = (props) => {
	return(
		<div>
			<h1>Login</h1>
			<form id="home-form" name="home-form"
				onSubmit={handleLogin}
				action="/login"
				method="POST">
				<input className="input-button" id="username" type="text" name="username" placeholder="Username" />
				<input className="input-button" id="password" type="password" name="password" placeholder="Password" />
				<input type="hidden" name="_csrf" value={props.csrf} />
				<input className="submit input-button" type="submit" value="Sign In" />
			</form>
			<p id="toSignup">Don't have an account? Sign Up</p>
		</div>
	);
};

//Function to use React to dynamically create the signup form
const SignupForm = (props) => {
	return(
		<div>
			<h1>Sign Up</h1>
			<form id="home-form" name="home-form"
				onSubmit={handleSignup}
				action="/signup"
				method="POST">
				<input className="input-button" id="username" type="text" name="username" placeholder="Username" />
				<input className="input-button" id="password" type="password" name="password" placeholder="Password" />
				<input className="input-button" id="password2" type="password" name="password2" placeholder="Re-type Password" />
				<input type="hidden" name="_csrf" value={props.csrf} />
				<input className="submit input-button" type="submit" value="Sign Up" />
			</form>
			<p id="toLogin">Already have an account? Log in</p>
		</div>
	);
};

//Function to render the login form to the page
const renderLoginForm = (csrf) => {
	ReactDOM.render(
		<LoginForm csrf={csrf} />,
		document.getElementById("home-content")
	);
	
	//Setup link to switch forms
	document.getElementById("toSignup").onclick = () => {
		renderSignupForm(csrf);
	};
};

//Function to render the signup form to the page
const renderSignupForm = (csrf) => {
	ReactDOM.render(
		<SignupForm csrf={csrf} />,
		document.getElementById("home-content")
	);
	
	//Setup link to switch forms
	document.getElementById("toLogin").onclick = () => {
		renderLoginForm(csrf);
	};
};

//Function to render the default form shown when going to
//the home page
const setupDefaultView = (csrf) => {
	renderSignupForm(csrf);
};

//Note: $(document).ready() is similar to window.onload = init;
//Make a call to get the token and render the forms
//when the page loads
$(document).ready(() => {
	getToken((token) => {
		setupDefaultView(token.csrfToken);
	});
});