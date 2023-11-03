export default (sequelize, DataTypes) => {
	const log_users = sequelize.define('log_users', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		user_name: {
			type: DataTypes.STRING,
		},
		ip: {
			type: DataTypes.STRING,
		},
		payload: {
			type: DataTypes.STRING,
		},
		query: {
			type: DataTypes.STRING,
		},
		ip: {
			type: DataTypes.STRING,
		},
		path: {
			type: DataTypes.STRING,
		},
		comment: {
			type: DataTypes.STRING,
		},
		token: {
			type: DataTypes.STRING,
		},
		user_agent: {
			type: DataTypes.STRING,
		},
		width: {
			type: DataTypes.INTEGER,
		},
	});
	
	return log_users;
};
