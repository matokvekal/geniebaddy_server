import Sequelize from 'sequelize';
import Logger from '../utils/Logger';
import initDatabaseModels from './initDatabaseModels'


export default async (config) => {
	console.log('config.database.HOST', config.database.MY_SQL_HOST||process.env.MY_SQL_HOST);
	console.log('config.database.USER', config.database.MY_SQL_USER || process.env.MY_SQL_USER);
	console.log('config.database.PASSWORD', config.database.MY_SQL_PASSWORD||process.env.MY_SQL_PASSWORD);
	const sequelize = new Sequelize(
		config.database.DB_NAME,
		config.database.USER ||process.env.MY_SQL_USER,
		config.database.PASSWORD || process.env.MY_SQL_PASSWORD,
		{
			host: config.database.MY_SQL_HOST||process.env.MY_SQL_HOST,
			port: config.database.PORT,
			dialect: config.database.dialect,
			operatorsAliases: false,
			logging: false,// remove console.logs
			pool: {
				max: config.database.pool.max,
				min: config.database.pool.min,
				acquire: config.database.pool.acquire,
				idle: config.database.pool.idle,
			},
		}
	);

	const db = { sequelize };
	const models = await initDatabaseModels(db);
	Object.assign(db, models);

	try {
		await sequelize.authenticate();
		Logger.info('Connection has been established successfully.');
	} catch (error) {
		Logger.error('Unable to connect to the database:', error);
	}

	Logger.debug('Finished initializing DB');

	return db;
};
