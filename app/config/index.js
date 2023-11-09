// TODO: Support multiple environments
// require('dotenv').config();

import Logger from '../utils/Logger';
console.log('at index.js process.env.NODE_ENV', process.env.NODE_ENV);
const mode = process.env.NODE_ENV || 'development';
Logger.debug(`Server is running in  ${mode} mode`);

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}


const baseConfig = {
	database: {
	MY_SQL_HOST: process.env.MY_SQL_HOST,
	MY_SQL_USER: process.env.MY_SQL_USER,
	MY_SQL_PASSWORD: process.env.MY_SQL_PASSWORD,
	DB: 'commissaire',
	dialect: 'mysql',
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000,
	},
},
	port: process.env.PORT || 5000,
	allowedOrigins: process.env.COMMISSAIRE_ALLOWED_ORIGINS
		? process.env.COMMISSAIRE_ALLOWED_ORIGINS.split(',')
		: [
				'http://localhost',
				'https://localhost',
				'http://3.79.151.83:5000',
				'https://3.79.151.83:5000',
				'http://localhost:3000',
				'https://localhost:5000',
				'http://localhost:5000',
		  ],
	TOKEN_KEY: process.env.COMMISSAIRE_TOKEN_KEY,
};

const configByEnv = {
	development: {
		...baseConfig,
		mode: 'development',
	},
	production: {
		...baseConfig,
		mode: 'production',
	},
	TOKEN_KEY: 'GENIEBADDYATOKENPROD',
	confirmationCodeLimit: 5,
	tokenExpireDayLimit: 360,
	loggerDebounceAmountInMS: 60000,
	smsSiteID: 35749,
	smsSitePassword: 'commissaire',
	smsSenderPhone: 'commissaire',
	smsMessageInnerName: 'commissaire',
	allowedAmountOfRequestsForIpPerMinute: 600,
	allowedAmountOfRequestsForIpPerFullDay: 10000,
	googlePhonenumber: '111111',
	gmailUserName: '1@gmail.com',
	gmailPassword: '11111',
};

export default configByEnv[mode];
