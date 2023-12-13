import { ServerErrors } from '../constants/ServerMessages';
import {
	createErrorLog,
	// createLogs,
} from '../utils/apiLoggerUtils';


export const errorLoggerMiddleware = (db) => async (req, res, next) => {
	try {
		res.createErrorLogAndSend = async (
			{ err = { message: ServerErrors.GENERAL_ERROR },
				message = ServerErrors.GENERAL_ERROR,
				status = 500 }) => {
			const error = `${err.message || err} - ${message}`;
			await createErrorLog(db, req, error);
			return res.status(status).send({
				message,
			});
		};
		return next();
	} catch (innerError) {
		console.error(
			`ERROR LOGGER FAILED - ${innerError}`
		);
	}
};

