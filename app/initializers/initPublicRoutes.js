import apiRoutes from "../routesPublic/publicRoutes";

export default (router, app) => {
  Object.keys(apiRoutes).forEach((k) => {
    apiRoutes[k](router, app);
  });
};
