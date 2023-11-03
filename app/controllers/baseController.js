import Logger from "../utils/Logger";
class BaseController {
  modelName = "";
  _dbModel = null;
  app = null;

  constructor(app, modelName) {
    this.app = app;
    this.modelName = modelName;
  }

  get dbModel() {

    if (!this.modelName) {
      Logger.error("Missing model name");
    }

    if (!this._dbModel) {
      this._dbModel = this.app.get("dbModels")[this.modelName];
    }
    return this._dbModel;
  }

  get allModel() {
    return this.app.get("dbModels")
  }

  get sequelize() {
    return this.app.get("dbModels").sequelize;
  }

}

export default BaseController;
