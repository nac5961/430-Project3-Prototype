//Function to send an AJAX request when a user submits a search
const handleSearch = (e) => {
	//Prevent the form from submitting
	e.preventDefault();
	
	//If a blank search load all payments
	if ($("#search-bar").val() === ''){
		loadAllPayments();
		return false;
	}
	
	//Send the AJAX request
	sendAjax($("#search").attr("method"), $("#search").attr("action"), $("#search").serialize(), (json) => {
		renderPayments(json);
	});
	
	//Prevent the form from changing pages
	return false;
};

//Function to send an AJAX request when a user clicks edit
const handleEdit = (e) => {
	//Get the index of the payment (index from display order)
	const index = e.target.value;
	
	//Get the name of the payment based off the index (id is 'paymentNameIndex' + index)
	const paymentName = document.getElementById(`paymentNameIndex${index}`).textContent;
	
	//Get the csrfToken from the page
	const csrfToken = document.getElementById('csrfToken').value;
	
	//Create data to send to the server to perform the edit
	const data = {
		name: paymentName,
		_csrf: csrfToken,
	};
	
	//Send the AJAX request
	sendAjax('POST', '/createTemp', data, redirect);
};

//Function to send an AJAX request when a user clicks delete
const handleDelete = (e) => {
	//Get the index of the payment (index from display order)
	const index = e.target.value;
	
	//Get the name of the payment based off the index (id is 'paymentNameIndex' + index)
	const paymentName = document.getElementById(`paymentNameIndex${index}`).textContent;
	
	//Get the csrfToken from the page
	const csrfToken = document.getElementById('csrfToken').value;
	
	//Create data to send to the server to perform the delete
	const data = {
		name: paymentName,
		_csrf: csrfToken,
	};
	
	//Send the AJAX request
	sendAjax('DELETE', '/removePayment', data, (json) => {
		//Display the message from the server
		displayMessage(json.message);
		
		//Show the new set of data but call the filter
		//method just in case a filter was being used
		filterPayments();
	});
};

//Function to make an AJAX request to get a filtered list of payments from the server
const filterPayments = () => {
	sendAjax('GET', '/filter', $("#filter-form").serialize(), (filteredPayments) => {
		renderPayments(filteredPayments); 
	});
};

//Function to make an AJAX request to get all the payments from the server
const loadAllPayments = () => {
	sendAjax('GET', '/getPayments', null, (allPayments) => {
		renderPayments(allPayments);
	});
};

//Function to render the payments
const renderPayments = (result) => {
	ReactDOM.render(
		<PaymentList payments={result.payments} />,
		document.getElementById('results-content')
	);
};

//Function to dynamically create the UI for displaying the payments
const PaymentList = (props) => {
	const payments = props.payments;
	
	//Render UI that says no payments were found
	if (!payments || payments.length === 0){
		return(
			<div>
				<h3 id="not-found" className="highlight">No payments were found</h3>
			</div>
		);
	}
	
	let index = 0;
	const paymentNameId = 'paymentNameIndex';
	
	//Get today and tomorrow's date
	const today = moment();
	const tomorrow = moment().add(1, 'days');
	
	//Use array.map to create UI for each payment
	const paymentNodes = payments.map((payment) => {
		index++;
		
		//Variables to show time display to user
		let timeLeft;
		let timeIcon;
		
		//Set the src for the priority icon
		const src = `/assets/img/${payment.priority}-priority-icon.png`;
		
		//Set the id to use for the name
		const nameId = `${paymentNameId}${index}`;
		
		//Convert the returned date to moment
		const dueDate = moment(new Date(payment.dueDate), 'MM-DD-YYYY');
		const dueDateString = dueDate.format('M/D/YY');
		
		//Today
		if (dueDate.isSame(today, 'day')){
			timeLeft = 'Today';
			timeIcon = 'clock-icon';
		}
		
		//Overdue
		else if (!dueDate.isAfter(today, 'day')){
			timeLeft = 'Overdue';
			timeIcon = 'overdue-icon';
		}
		
		//Due Tomorrow
		else if (dueDate.isSame(tomorrow, 'day')){
			timeLeft = 'Tomorrow';
			timeIcon = 'clock-icon';
		}
		
		//Due in 2 or more days
		else{
			//Calculate the number of days from today to the due date
			const timeBetweenDays = dueDate.diff(today, 'days') + 1;
			
			timeLeft = `Due in ${timeBetweenDays} days`;
			timeIcon = 'clock-icon';
		}
		
		return(
			<div className="payment">
				<div className="payment-priority">
					<img src={src} alt={payment.priority} />
				</div>
				<h3 id={nameId} className="payment-name highlight">{payment.name}</h3>
				<h3 className="payment-cost highlight">${payment.cost}</h3>
				<div className="payment-icons-container">
					<ul className="date-icons">
						<li className="calendar-icon">{dueDateString}</li>
						<li className={timeIcon}>{timeLeft}</li>
					</ul>
					<ul className="options-icons">
						<li onClick={handleEdit} value={index} className="edit-icon">Edit</li>
						<li onClick={handleDelete} value={index} className="delete-icon">Delete</li>
					</ul>
				</div>
			</div>
		);
	});
	
	//Render the list we just created
	return(
		<div>
			{paymentNodes}
		</div>
	);
};

//Function to render forms and setup event listeners
const setupUI = () => {
	//Get reference to forms
	const searchForm = document.getElementById('search');
	const multiFilters = document.getElementsByClassName('multi-filter');
	const singleFilters = document.getElementsByClassName('single-filter');
	
	//Event listener for search form
	searchForm.onsubmit = (e) => {
		//Get all the checkboxes from the filter
		const checkboxes = document.getElementsByClassName('filter-input');
		
		//Uncheck all checkboxes since the search doesn't take the filter into account
		for (let i = 0; i < checkboxes.length; i++){
			checkboxes[i].checked = false;
		}
		
		//Apply the search
		handleSearch(e);
	};
	
	//Event listener for Date section of filter
	//multi-filter means it can be used with other filters
	//in the same section
	for (let i = 0; i < multiFilters.length; i++){
		const filter = multiFilters[i];
		
		filter.onchange = () => {
			//Clear the search bar
			document.getElementById('search-bar').value = '';
			
			//Perform the filter
			filterPayments();
		};
	}
	
	//Event listener for every other section of filter
	//single-filter means it cannot be used with other filters
	//in the same section
	for (let i = 0; i < singleFilters.length; i++){
		const filter = singleFilters[i];
		
		filter.onchange = (e) => {
			//Uncheck all single-filters except for this one
			for (let j = 0; j < singleFilters.length; j++){
				const otherFilter = singleFilters[j];
				
				if (e.target === otherFilter)
					continue;
				
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
$(document).ready(() => {
	setupUI();
});