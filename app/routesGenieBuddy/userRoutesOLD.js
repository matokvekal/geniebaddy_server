import UserController from "../controllersGb/userControllerOld";

export default (router, app) => {
  const modelBase = "gb";
  const modelIdentifier = "id";
  const userController = new UserController(app, modelBase);

//Get /api/gb/userTopics
  router.get(
    `/userTopics`,
    userController.topics.bind(userController)
  );



};
