import express from 'express';
import * as middlewares from '../middlewares';
// import initAdminRoutes from './initAdminRoutes';
import initGbRoutes from './initGbRoutes';
// import initPublicRoutes from './initPublicRoutes';
import initDatabase from './initDatabase';
import { ALL } from '../constants/permissionStrings';
import momentTimeZone from 'moment-timezone';
import rateLimit from 'express-rate-limit';
// import { getFixedValueAndEqualSign } from '../utils/getFixedValues';
momentTimeZone.tz.setDefault('Etc/UTC');
/**
 * Create all routes and middlewares
 * @returns {Promise<Application>}
 */
const cors = require('cors');
export default async (config) => {
	const app = express();
	const adminRouter = express.Router();
	const publicRouter = express.Router();
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

	app.use(
		cors({
			origin: [
				'http://localhost',
				'https://localhost',
				'http://212.80.207.146',
				'http://localhost:3000',
				'http://localhost:3001',
				'https://212.80.207.146',
				'https://localhost:3000',
			], // (Whatever your frontend url is)
			credentials: true, // <= Accept credentials (cookies) sent by the client
		}),
	);

	// const allowedPublicConfigObject = {
	// 	//list of controllers
	// 	authentication: ALL,
	// };
	// publicRouter.use(middlewares.apiMiddleware);
	// publicRouter.use(middlewares.loggerMiddleware(db));
	// publicRouter.use(middlewares.errorLoggerMiddleware(db));
	// publicRouter.use(middlewares.textValidationMiddleware);
	// publicRouter.use(middlewares.authenticationMiddleware(db));
	// publicRouter.use(
	// 	middlewares.controllerPermissionMiddleware(db, allowedPublicConfigObject),
	// );
	// initPublicRoutes(publicRouter, app);

	// const allowedAdminConfigObject = {
	// 	authentication: ALL,
	// };
	// adminRouter.use(middlewares.apiMiddleware);
	// adminRouter.use(middlewares.loggerMiddleware(db));
	// adminRouter.use(middlewares.errorLoggerMiddleware(db));
	// adminRouter.use(middlewares.textValidationMiddleware);
	// adminRouter.use(middlewares.authenticationMiddleware(db));
	// adminRouter.use(
	// 	middlewares.controllerPermissionMiddleware(db, allowedAdminConfigObject),
	// );
	// initAdminRoutes(adminRouter, app);
	// Routes
	// app.use('/api', limiter);
	// app.use('/api', publicRouter);
	// app.use('/api/cycling', adminRouter);
	app.use('/api/gb', GbRouter);
	app.use(middlewares.errorMiddleware);
	return app;
};
