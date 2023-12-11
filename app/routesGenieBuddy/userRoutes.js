import UserController from '../controllersGb/userController';

export default (router, app) => {
	const modelBase = 'gb';
	const userController = new UserController(app, modelBase);

	// GET api/gb/userposts
	router.get(`/userposts`, userController.userGetPosts.bind(userController));
	// GET api/gb/userrefreshposts
	router.get(`/userrefreshposts`, userController.userRefreshPosts.bind(userController));

	// GET api/gb/usernewchats
	router.get(`/usernewchats`, userController.userGetNewChats.bind(userController));
	// POST api/gb/userpost
	router.post(`/userpost`, userController.userSendPost.bind(userController));

	// GET api/gb/getuserlimits
	router.get(`/getuserlimits`, userController.userLimits.bind(userController));
	// GET api/gb/getpostbyid
	router.get(`/getpostbyid`, userController.userGetPostById.bind(userController));	

		// POST /gb/action
	router.post(`/action`, userController.updateAction.bind(userController));
		// PUT /gb/userreadposts
	router.get(`/userreadposts`, userController.userReadPosts.bind(userController));
};

