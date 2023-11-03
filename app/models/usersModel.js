export default (sequelize, Types) => {

	const User = sequelize.define(
		'user',
		{
			id: {
				type: Types.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			user_name: {
				type: Types.STRING,
				allowNull: false,
			},
			first_name: {
				type: Types.STRING,
			},
			last_name: {
				type: Types.STRING,
			},
			email: {
				type: Types.STRING,
			},
			mobile: {
				type: Types.STRING,
			},
			role: {
				type: Types.STRING,
			},
			owner_id: {
				type: Types.STRING,
			},
			is_active: {
				type: Types.INTEGER,
			},
			otp: {
				type: Types.STRING,
			},
			validation_date: {
				type: Types.DATE,
			},
			last_login: {
				type: Types.DATE,
			},
			blocked: {
				type: Types.INTEGER,
			},
			block_date: {
				type: Types.DATE,
			},
			is_register: {
				type: Types.INTEGER,
			},
			is_active: {
				type: Types.INTEGER,
			},
			requestsPerDay: {
				type: Types.INTEGER,
			},
			current_request_amount_per_day: {
				type: Types.INTEGER,
			},
			password: {
				type: Types.STRING,
			},
			source: {
				type: Types.STRING,
			},
			comment: {
				type: Types.STRING,
			},
			token: {
				type: Types.STRING,
			},
			cycling_Activated: {
				type: Types.INTEGER,
			},
		},
		{
			timestamps: false,
			indexes: [
				{
					unique: true,
					fields: ['user_name', 'company_id'],
				},
			],
		},
	);

	User.removeAttribute('id');

	return User;
};
