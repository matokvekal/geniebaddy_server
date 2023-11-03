import PublicController from "../controllersPublic/publicRacesController";

export default (router, app) => {
  const modelBase = "free";
  const modelIdentifier = "id";
  const publicController = new PublicController(app, modelBase);
//---------------working 3-6-23----------------

//Get /api/free/races
  router.get(
    `/races`,
    publicController.getFreeRaces.bind(publicController)
  );
  router.get(
    `/race_filter`,
    publicController.getFreeRacesFilters.bind(publicController)
  );
  router.get(
    `/menu`,
    publicController.getFreeRaceMenu.bind(publicController)
  );
  router.get(
    `/race_categories`,
    publicController.getFreeRacesCategories.bind(publicController)
  );

  router.get(
    `/lastraces`,
    publicController.getFreelastRaces.bind(publicController)
  );
  router.get(
    `/race_riders`,
    publicController.getFreeRaceRiders.bind(publicController)
  );
  router.get(
    `/riders_laps`,
    publicController.getFreeRaceRidersLaps.bind(publicController)
  );
  router.get(
    `/racefields`,
    publicController.getRaceFields.bind(publicController)
  );

  router.get(
    `/racedata`,
    publicController.getFreeRaceData.bind(publicController)
  );



};
