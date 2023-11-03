// TODO: Support multiple environments

import Logger from '../utils/Logger';

// const mode = process.env.MODE || 'production';
const mode = process.env.MODE || 'development';
// const mode = process.env.MODE || 'localhost';

Logger.debug(`Server is running in  ${mode} mode`);

const configByEnv = {
	connection: {
		multipleStatements: true,
		host: 'dbcommissairenew.cig6gnsg5vjp.eu-central-1.rds.amazonaws.com',
		user: 'admin',
		password: 'zaqzaq8*',
		DB: 'commissaire',
		dialect: 'mysql',
	},
	development: {
		mode: 'development',
		database: {
			HOST: 'dbcommissairenew.cig6gnsg5vjp.eu-central-1.rds.amazonaws.com',
			// HOST: 'commissaire2022.c8cwyjpllwnw.eu-central-1.rds.amazonaws.com',
			USER: 'admin',
			PORT: 3306,
			PASSWORD: 'zaqzaq8*',
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
		allowedOrigins:
			'http://localhost:5000,http://localhost:3000,http://localhost:3001,www.commissaire.us,http://www.commissaire.us,https://www.commissaire.us,d2pi1ekwewlf4x.cloudfront.net,https://d2pi1ekwewlf4x.cloudfront.net,http://d2pi1ekwewlf4x.cloudfront.net',
		TOKEN_KEY: 'COMMISSAIRE_TOKEN_KEY_PRODUCTION',
		confirmationCodeLimit: 5,
		tokenExpireDayLimit: 360,
		loggerDebounceAmountInMS: 60000,
		smsSiteID: 35749,
		smsSitePassword: 'commissaire',
		smsSenderPhone: 'commissaire',
		smsMessageInnerName: 'commissaire',
		allowedAmountOfRequestsForIpPerMinute: 600,
		allowedAmountOfRequestsForIpPerFullDay: 10000,
		googlePhonenumber: '11111111111',
		gmailUserName: 'tipusharim@gmail.com',
		gmailPassword: 'Gilad2023',
	},
};

export default configByEnv[mode];
