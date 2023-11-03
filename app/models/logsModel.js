export default (sequelize, DataTypes) => {
	const logs = sequelize.define('logs', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		user_name: {
			type: DataTypes.STRING,
		},
		company_id: {
			type: DataTypes.INTEGER,
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
		message: {
			type: DataTypes.STRING,
		},
		cpu: {
			type: DataTypes.STRING,
		},
		memory: {
			type: DataTypes.STRING,
		},
		err: {
			type: DataTypes.TEXT,
		},
	});
	
	return logs;
};
