const { Op } = require("sequelize");

module.exports = function (db) {
  return {
    getAllTypes,
  };

  async function getAllTypes(where) {
    return await db.findAll({ where: where });
  }
};
