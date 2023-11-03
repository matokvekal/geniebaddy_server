import AuthenticationController from '../controllersPublic/authenticationController';

export default (router, app) => {
	const authenticationController = new AuthenticationController(app, 'user');
//---------working 3-6-23----------------
//POST /api/auth/login
	router.post(`/auth/login`, authenticationController.login);

	router.post(`/auth/confirmCode`, authenticationController.confirmCode);

	router.post(`/auth/loginWithToken`, authenticationController.loginWithToken);

	router.post(`/auth/register`, authenticationController.register);
	router.post(`/auth/confirmCodeEmail`, authenticationController.confirmCodeEmail);

	router.post(
		`/auth/forgot_password`,
		authenticationController.forgot_password,
	);

	router.post(`/auth/reset_password`, authenticationController.reset_password);
};
