import ServerController from '../controllersGb/serverController';

export default (router, app) => {
	const modelBase = 'gb';
	const serverController = new ServerController(app, modelBase);

	// GET api/gb/topics
	router.get(`/topics`,serverController.getTopics.bind(serverController));


};
