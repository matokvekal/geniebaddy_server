import UserController from '../controllersGb/userController';

export default (router, app) => {
	const modelBase = 'gb';
	const userController = new UserController(app, modelBase);

	// GET api/gb/userposts
	router.get(`/userposts`, userController.userGetPosts.bind(userController));
	// POST api/gb/userpost
	router.post(`/userpost`, userController.userSendPost.bind(userController));

	// GET api/gb/getuserlimits
	router.get(`/getuserlimits`, userController.userLimits.bind(userController));
};
