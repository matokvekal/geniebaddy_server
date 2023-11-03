const { QueryTypes } = require('sequelize');

// const currentUrl = config.default.alertUtilUrl;

exports.sendMobileNotification = async function ({
	owner_id,
	userPhone,
	title,
	body,
	data,
    sequelize,
}) {
	try {
		let fireBaseToken;
		if (owner_id && userPhone && (title || body || data)) {
			fireBaseToken = await sequelize.query(
				`SELECT distinct fire_base_token FROM drivers WHERE phone_number = ${userPhone} and owner_id= ${owner_id}`,
				{ type: QueryTypes.SELECT }
			);
		} else {
            console.log('information requierd');
			return 'information requierd';
		}

		if (fireBaseToken.length>0) {
			await sequelize.query(
				"INSERT INTO mobile_notifications (`owner_id`,`phone_number`,`fire_base_token`,`message_title`,`message_body`,`planning_id`) VALUES ('" +
					owner_id +
					"', '" +
					userPhone +
					"', '" +
					fireBaseToken[0].fire_base_token +
					"', '" +
					title +
					"', '" +
					body +
					"', '" +
					data +
					"')",
                    { type: QueryTypes.INSERT }
			);
		} else {
            console.log('No fireBaseToken');
			return 'No fireBaseToken';
		}
	} catch (e) {
		console.log('sendMobileNotification', e);
		return 'err sendMobileNotification';
	}
};
