import AuthController from '../controllersGb/authController';

export default (router, app) => {
	const modelBase = 'gb';
	const authController = new AuthController(app, modelBase);

	//POST /api/gb/login

	router.post(`/login`, authController.login);

	router.post(`/confirmCodeEmail`, authController.confirmCodeEmail);

	// router.post(`/confirmCodePhone`, authController.confirmCodePhone);

	// router.post(`/loginWithToken`, authController.loginWithToken);

	//POST /api/gb/register
	router.post(`/register`, authController.register.bind(authController));

	router.post(`/forgot_password`, authController.forgot_password);

	router.post(`/reset_password`, authController.reset_password);
};
