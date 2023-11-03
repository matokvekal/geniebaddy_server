import GenieController from '../controllersGb/genieController';

export default (router, app) => {
	const modelBase = 'gb';
	const genieController = new GenieController(app, modelBase);

	// GET /gb/genieposts
	router.get(
		`/genieposts`,
		genieController.genieGetPosts.bind(genieController),
	);
	// GET /gb/genienewposts
	router.get(
		`/genienewposts`,
		genieController.genieGetNewPosts.bind(genieController),
	);
	// POST /gb/geniepost
	router.post(
		`/geniepost`,
		genieController.genieSendPost.bind(genieController),
	);
	// POST /gb/geniechoosepost
	router.post(
		`/geniechoosepost`,
		genieController.genieChoosePost.bind(genieController),
	);

	}