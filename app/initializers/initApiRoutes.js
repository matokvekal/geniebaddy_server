import apiRoutes from "../routesPublic/publicRoutes";

export default (router, app) => {
  // Generates router initiation for each imported routing
  Object.keys(apiRoutes).forEach((k) => {
    apiRoutes[k](router, app);
  });
};
