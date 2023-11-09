// TODO: Support multiple environments

import Logger from '../utils/Logger';

// const mode = process.env.MODE || 'production';
const mode = process.env.ENV || 'development';
// const mode = process.env.MODE || 'localhost';

Logger.debug(`Server is running in  ${mode} mode`);

const configByEnv = {
	connection: {
		multipleStatements: true,
		host: process.env.MY_SQL_HOST,
		user: process.env.USER,
		password: process.env.PASSWORD,
		DB: 'commissaire',
		dialect: 'mysql',
	},
	development: {
		mode: 'development',
		database: {
			HOST: process.env.MY_SQL_HOST,
			USER: process.env.USER,
			PORT: 3306,
			PASSWORD: process.env.PASSWORD,
			NAME: 'commissaire',
			dialect: 'mysql',
			pool: {
				max: 5,
				min: 0,
				acquire: 30000,
				idle: 10000,
			},
		},
		port: process.env.PORT || 5000,
		allowedOrigins: `http://localhost:5000,http://localhost:3000,http://localhost:3001,${process.env.DOMAIN},http://${process.env.DOMAIN},https://${process.env.DOMAIN}`,
		TOKEN_KEY: process.env.TOKEN_KEY_PRODUCTION,
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
	},
};

export default configByEnv[mode];
