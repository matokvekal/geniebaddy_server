import genieBuddyRoutes from "../routesGenieBuddy/genieBuddyRoutes";

export default (router, app) => {
  // Generates router initiation for each imported routing
  Object.keys(genieBuddyRoutes).forEach((k) => {
    genieBuddyRoutes[k](router, app);
  });
};
