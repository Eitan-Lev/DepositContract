const routes = require('next-routes')();

{
	/*
':' is a wildcard and the name after it is a variable
*/
}

routes
	.add('/SignatureHelper', 'SignatureHelper')
	.add('/deposits/new', '/deposits/new')
	.add('/deposits/:address', '/deposits/show')
	.add('/deposits/:address/manage', '/deposits/manage')
	.add('/deposits/:address/manageCounterpart', '/deposits/manageCounterpart');

module.exports = routes;
