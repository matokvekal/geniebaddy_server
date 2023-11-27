import express from 'express';
import * as middlewares from '../middlewares';
import initGbRoutes from './initGbRoutes';
import initDatabase from './initDatabase';
import { ALL } from '../constants/permissionStrings';
import momentTimeZone from 'moment-timezone';
import rateLimit from 'express-rate-limit';
momentTimeZone.tz.setDefault('Etc/UTC');

// const cors = require('cors');
export default async (config) => {
	console.log('init server');
	// console.log('at init server process.env', process.env.NODE_ENV);
	const app = express();
	const GbRouter = express.Router();
	const db = await initDatabase(config);
	const limiter = rateLimit({
		max: 1000,
		windowMs: 60 * 60 * 1000,
		message: 'Too many requests from this IP, please try again in an hour!',
	});

	app.set('dbModels', db);

	const allowedGbConfigObject = {
		authentication: ALL,
	};
	GbRouter.use(middlewares.apiMiddleware);
	GbRouter.use(middlewares.loggerMiddleware(db));
	GbRouter.use(middlewares.errorLoggerMiddleware(db));
	GbRouter.use(middlewares.textValidationMiddleware);
	GbRouter.use(middlewares.authenticationMiddleware(db));
	GbRouter.use(middlewares.routePermissions);
	GbRouter.use(
		middlewares.controllerPermissionMiddleware(db, allowedGbConfigObject),
	);
	initGbRoutes(GbRouter, app);

	app.use('/api/gb', GbRouter);
	app.use(middlewares.errorMiddleware);
	return app;
};
