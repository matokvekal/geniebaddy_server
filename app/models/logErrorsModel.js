export default async (sequelize, DataTypes) => {
	const logErrors = sequelize.define('log_errors', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		user_name: {
			type: DataTypes.STRING,
		},
		date: {
			type: DataTypes.DATE,
		},
		ip: {
			type: DataTypes.STRING,
		},
		path: {
			type: DataTypes.STRING,
		},
		err: {
			type: DataTypes.STRING,
		},
		cpu: {
			type: DataTypes.STRING,
		},
		memory: {
			type: DataTypes.STRING,
		},
		owner_id: {
			type: DataTypes.STRING,
		},
	});
	// await logErrors.sync({ alter: true });
	return logErrors;
};
 