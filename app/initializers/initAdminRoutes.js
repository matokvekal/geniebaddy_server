import adminRoutes from "../routesAdmin/adminRoutes";

export default (router, app) => {
  // Generates router initiation for each imported routing
  Object.keys(adminRoutes).forEach((k) => {
    adminRoutes[k](router, app);
  });
};
