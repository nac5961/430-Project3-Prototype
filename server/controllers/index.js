/*
	Note: Export in index.js and then import index.js
	in other files so that we will have access to all of
	the exports with a single import. Otherwise you'd have
	to import each file individually in other files just to
	gain access to them instead of doing one import to index.js,
	which will include everything
*/

module.exports.Account = require('./Account.js');
module.exports.Payment = require('./Payment.js');
