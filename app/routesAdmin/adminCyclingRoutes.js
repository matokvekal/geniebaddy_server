import CyclingController from '../controllersAdmin/cyclingController';

export default (router, app) => {
	const modelBase = 'cycling';
	const cyclingController = new CyclingController(
		app,
		modelBase,
	);

//-----------working 3-6-23----------------
//POST /api/cycling/location
  router.post(
    `/location`,
    cyclingController.location.bind(cyclingController)
  );
  router.post(
    `/config`,
    cyclingController.config.bind(cyclingController)
  );
  router.post(
    `/contacts`,
    cyclingController.contacts.bind(cyclingController)
  );
  router.post(
    `/riders`,
    cyclingController.riders.bind(cyclingController)
  );
  router.post(
    `/transmit`,
    cyclingController.callRidingStatus.bind(cyclingController)
  );

};
