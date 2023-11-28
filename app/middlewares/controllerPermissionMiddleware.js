import { ADMIN, ALL } from '../constants/permissionStrings';
import { ServerLoginMessages } from '../constants/ServerMessages';

const getIsAllowedWithUser = (userRole, allowedConfigObject, controller) => {
	return (
		userRole.includes(ADMIN) || // or the user is admin
		userRole.toLowerCase().includes(allowedConfigObject[ALL].toLowerCase()) || // or the user has the minimum requirements to access all requests
		userRole
			.toLowerCase()
			.includes(allowedConfigObject[controller].toLowerCase()) // or the user has the permission to access this api
	);
};

const getIsAllowedWithoutUser = (allowedConfigObject, controller) => {
	return (
		!allowedConfigObject[controller] || // if api doesnt exist on the object
		allowedConfigObject[ALL] === ALL || // or everyone can accees every controller
		allowedConfigObject[controller].toLowerCase() === ALL // or it does and allows all
	);
};

const controllerPermissionMiddleware =
	(db, allowedConfigObject) => async (req, res, next) => {
		console.log('at permition middlware');
		const [_space, controller, action] = req.path.split('/'); // if needed we can also use the specific api ('action') instead of the all controller
		const isAllowedWithoutUser = getIsAllowedWithoutUser(
			allowedConfigObject,
			controller,
		);
		if (isAllowedWithoutUser) {
			return next();
		}
		if (req.user) {
			const isAllowed = getIsAllowedWithUser(
				req.user.user_role,
				allowedConfigObject,
				controller,
			);
			if (isAllowed) {
				return next();
			}
			return await res.createErrorLogAndSend({
				message: ServerLoginMessages.NOT_ALLOWED,
				status: 401,
			});
		}
		return await res.createErrorLogAndSend({
			message: ServerLoginMessages.TOKEN_REQUIRED,
			status: 401,
		});
	};

export default controllerPermissionMiddleware;
