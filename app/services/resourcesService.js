const { Op } = require("sequelize");
const moment = require("moment");

const RESOURCES_WHERE =
{
  [Op.or]: {
    driver_first_name: {
      [Op.ne]: ''
    },
    driver_nick_name: {
      [Op.ne]: ''
    },
    car_number: {
      [Op.ne]: ''
    }
  }
};

module.exports = (db) => {
  return {
    addResource,
    updateResource,
    incrementResource,
    getAllResources,
    getResource,
    getResourcesByIdOrDateUpdated,
  };

  function addResource(data) {
    return db.create(data);
  }

  function updateResource(data, where) {
    return db.update(data, { where: where });
  }

  function incrementResource(column, options) {
    return db.increment(column, options);
  }

  function getAllResources(where = [], attributes = '') {
    where.push(RESOURCES_WHERE)
    attributes = attributes ? { attributes: attributes } : {}
    return db.findAll({
      where: where,
      ...attributes
    });
  }

  function getResource(where) {
    return db.findOne({ where: where });
  }

  function getResourcesByIdOrDateUpdated(owner_id = null, zone = null, attributes) {
    let where = [];
    let whereOr = [];

    owner_id = owner_id + '';
    if (owner_id && owner_id.indexOf(',') != -1) {
      let companyIdWhere = [];
      let count = (owner_id.match(/,/g) || []).length;

      for (let i = 0; i < count + 1; i++) {
        companyIdWhere.push({ owner_id: owner_id.split(',')[i] });
      }
      whereOr.push({ [Op.or]: companyIdWhere });
    } else if (owner_id && owner_id != 'null') {
      whereOr.push({ owner_id: owner_id })
    }

    if (zone && zone.indexOf(',') != -1) {
      let zoneWhere = [];
      let count = (zone.match(/,/g) || []).length;

      for (let i = 0; i < count + 1; i++) {
        zoneWhere.push({ zone: zone.split(',')[i] });
      }
      whereOr.push({ [Op.or]: zoneWhere });
    } else if (zone && zone != 'null') {
      whereOr.push({ zone: zone })
    }

    if (Object.values(whereOr).length > 0) {
      where.push({ [Op.or]: whereOr })
    }

    where.push(RESOURCES_WHERE)

    // return where;
    return db.findAll({
      where: where,
      attributes: attributes
    }); // Do not change it to (where)
  }

};
