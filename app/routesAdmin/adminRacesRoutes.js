import AdminController from '../controllersAdmin/adminController';

export default (router, app) => {
	const modelBase = 'admin';
	const adminsController = new AdminController(
		app,
		modelBase,
	);

// --------not working 3-6-23----------------
  router.get(
    `/admin/races`,
    adminsController.getRaces.bind(adminsController)
  );
  router.post(
    `/admin/uploadrace`,
    adminsController.uploadRaceCsv.bind(adminsController)
  );
  // router.post(
  //   `/admin/cycling`,
  //   adminsController.config.bind(adminsController)
  // );


};
