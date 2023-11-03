const { Op } = require("sequelize");

module.exports = (function (db) {
    return {
        getAllTrips,
    };

    function getAllTrips(where) {
        return db.findAll({ where: where });
    }

})



