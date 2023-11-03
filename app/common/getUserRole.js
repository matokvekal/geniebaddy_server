const { QueryTypes } = require('sequelize');
const { getFixedValue } = require('../utils/getFixedValues');

const getUserRole = async (sequelize, user) => {
	const user_role = await sequelize.query(
		`SELECT  distinct orders,planning,control,hr,safety,maintenance,entities,show_percent,show_cost,users FROM user_roles 
		WHERE id=${getFixedValue(user.user_role_id)} AND owner_id=${
			user.owner_id
		} AND is_active=1 limit 1`,
		{ type: QueryTypes.SELECT }
	);
	return user_role;
};

export default getUserRole;
