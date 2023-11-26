import routePermissions from '../config/routePermissions';

const checkRoutePermission = (req, res, next) => {
	const rolesAllowed = routePermissions[req.path];

	if (!rolesAllowed) {
		return res.status(404).send('Route not found');
	}
	if (rolesAllowed.includes('all')) {
		return next();
	}
	if (
		rolesAllowed.includes(req.user.user_role) ||
		rolesAllowed.includes('all')
	) {
		return next();
	} else {
		return res.status(403).send('Access denied');
	}
};
export default checkRoutePermission;
