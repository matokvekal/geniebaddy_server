
import InitServer from './initializers/initServer';
import config from './config';
var fs = require('fs');
const path = require('path');
import Logger from './utils/Logger';
const morgan = require('morgan');
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

console.log('at index.js process.env ver 0.1.0', process.env.NODE_ENV);
InitServer(config).then((app) => {
  app.use(morgan('combined', { stream: accessLogStream }))
  // Initialize application server
  app.listen(config.port, () => Logger.debug(`Listening on port: ${config.port} ver 1.02`));
});
