const routes = require('next-routes')();

//':' is a wildcard and the name after it is a variable

routes
  .add('/deposits/new', '/deposits/new')
  .add('/deposits/:address', '/deposits/show')
  .add('/deposits/:address/manage', '/deposits/manage')
  // .add('/campaigns/:address/requests/new', '/campaigns/requests/new');

module.exports = routes;
