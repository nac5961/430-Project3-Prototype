//Function to send an AJAX request when the user changes the selected month
const handleSelect = (e) => {
	//Clear the displayed data
	if (e.target.value === 'none'){
		clearData();
	}
	
	//Get data to display
	else{
		//Create a filter to get payments ordered by their date
		const filterData = {
			date: ['overdue', 'today', 'tomorrow', 'later']
		};
		
		//Get the filtered list and render them
		sendAjax('GET', '/filter', filterData, (filteredPayments) => {
			renderPayments(filteredPayments);
		});
	}
};

//Function to clear the displayed data
const clearData = () => {
	//Clear the list of data
	document.getElementById('expenses').innerHTML = '';
	
	//Clear the cost
	document.getElementById('expense-total').textContent = '$0';
	
	//Clear the graph
	Plotly.purge('graph');
};

//Function to render the payments for the specific month
const renderPayments = (result) => {
	ReactDOM.render(
		<PaymentList payments={result.payments} />,
		document.getElementById('expenses')
	);
};

//Function to render the months for the select element
const renderMonths = (result) => {
	ReactDOM.render(
		<MonthList payments={result.payments} />,
		document.getElementById('expense-options')
	);
};

//Function to dynamically display the payments for the selected month
const PaymentList = (props) => {
	let total = 0;
	const paymentNodes = [];
	const paymentCosts = [];
	const paymentDates = [];
	const payments = props.payments;
	const selectedMonth = document.querySelector('select').value;
	
	for (let i = 0; i < payments.length; i++){
		//Get the current payment
		const payment = payments[i];
		
		//Convert the returned date to a string
		const dueDate = moment(new Date(payment.dueDate), 'MM-DD-YYYY');
		const dueDateString = dueDate.format('MMMM YYYY').toLowerCase();
		const dueDateDisplayString = dueDate.format('M/D/YY');
		const dueDateGraphString = dueDate.format('YYYY-MM-DD');
		
		//Store the payments that match the selected month
		if (dueDateString === selectedMonth){			
			//Increase the total
			total += payment.cost;
			
			//Add the payment data to graph
			paymentCosts.push(total);
			paymentDates.push(dueDateGraphString);
			
			//Set the src for the priority
			const src = `/assets/img/${payment.priority}-priority-icon.png`;
			
			//Format the priority to have the first letter uppercased
			const upperLetter = payment.priority.charAt(0).toUpperCase();
			const afterFirstLetter = payment.priority.substr(1);
		
			const formattedPriority = `${upperLetter}${afterFirstLetter}`;
			
			//Create the HTML
			paymentNodes.push(
				<div className="expenses">
					<p className="expense-name">{payment.name}</p>
					<p className="expense-cost">${payment.cost}</p>
					<p className="expense-date">{dueDateDisplayString}</p>
					<p className="expense-priority"><img src={src} alt={payment.priority} />{formattedPriority}</p>
				</div>
			);
		}
	}
	
	//Set the total cost
	document.getElementById('expense-total').textContent = `$${total}`;
	
	//Create the graph
	createGraph(paymentCosts, paymentDates);
	
	return(
		<div>
			{paymentNodes}
		</div>
	);
};

//Function to dynamically create the options for the select element
const MonthList = (props) => {
	const months = [];
	const optionNodes = [];
	const payments = props.payments;
	
	for (let i = 0; i < payments.length; i++){
		//Get the current payment
		const payment = payments[i];
		
		//Convert the returned date to a string
		const dueDate = moment(new Date(payment.dueDate), 'MM-DD-YYYY');
		const dueDateString = dueDate.format('MMMM YYYY');
		const dueDateStringLow = dueDateString.toLowerCase();
		
		//Add the month if this is the first time we've seen it and
		//create the options node
		if (!months.includes(dueDateStringLow)){
			months.push(dueDateStringLow);
			
			optionNodes.push(
				<option value={dueDateStringLow}>{dueDateString}</option>
			);
		}
	}
	
	return(
		<select onChange={handleSelect}>
			<option value="none">None</option>
			{optionNodes}
		</select>
	);
};

//Function to graph the payments
const createGraph = (costArr, dateArr) => {
	//Get the month and year from the dates to use for the title
	const title = moment(dateArr[0]).format('MMMM YYYY');
	
	//Set the data for the graph
	const data = [
		{
			x: dateArr,
			y: costArr,
			type: 'scatter',
			mode: 'lines+markers',
			line: {color: '#71c0cf'}
		}
	];
	
	//Set the layout for the graph
	const layout = {
		title: `${title} Expenses`,
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
	const config = {
		responsive: true,
		displayModeBar: false
	};
	
	//Plot the data
	Plotly.newPlot('graph', data, layout, config);
};

//Function to setup the select element
const setupUI = (jsonData) => {
	renderMonths(jsonData);
};

//Note: $(document).ready() is similar to window.onload = init;
//Setup event listeners and display payments when page loads
$(document).ready(() => {
	sendAjax('GET', '/getPayments', null, (allPayments) => {
		setupUI(allPayments);
	});
});