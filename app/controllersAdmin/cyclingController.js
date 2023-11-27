import BaseController from './baseController';
import { getFixedValue } from '../utils/getFixedValues';
const { QueryTypes } = require('sequelize');
import config from '../config/config.json';
const moment = require('moment');

const { parseForm, runQuery } = require('../utils/forms');

class CyclingController extends BaseController {
	constructor(app, modelName, sequelize) {
		super(app, modelName, sequelize);
	}

	//POST/api/cycling/riders
	riders = async (req, res) => {
		console.log('at riders');
		let defaultRadius = config.defaultRadius;

		try {
			const { time, long, lat, heading, speed, timestamp } = req.body;
			if (
				!req.user.cycling_Activated ||
				!req.user.is_register ||
				!req.user.is_active
			) {
				return res.send({
					success: false,
					message: 'Error: user is not activated',
				});
			}

			const SQL = ` CALL commissaire.cyclist_riders(
			${getFixedValue(req.user.user_name)},
			${getFixedValue(defaultRadius)},
			'${time}')`;
			// //console.log(SQL);
			const response = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			return res.send({
				success: true,
				message: 'ok',
				data: response ? response[0] : null,
			});
		} catch (err) {
			console.log('err', err);
			return res.send({ success: false, message: 'Error: ' + err });
		}
	};

	//GET/api/cycling/contacts
	contacts = async (req, res) => {
		console.log('at contacts');
		// console.log('at contacts-----------------req.user:', req.user);

		try {
			if (!req || !req.body || !req.user.user_name) {
				return res.send({
					success: false,
					message: 'Error no data at contacts',
				});
			}
			if (
				!req.user.cycling_Activated ||
				!req.user.is_register ||
				!req.user.is_active
			) {
				return res.send({
					success: false,
					message: 'Error: user is not activated',
				});
			}
			const { addRider, hideRider, showRider, deleteRider, time } = req.body;
			// console.log("contacts : addRider, hideRider, showRider, deleteRider,time",addRider, hideRider, showRider, deleteRider,time)
			let action, rider2;
			if (addRider) {
				action = 'addRider';
				rider2 = addRider;
			} else if (hideRider) {
				action = 'hideRider';
				rider2 = hideRider;
			} else if (showRider) {
				action = 'showRider';
				rider2 = showRider;
			} else if (deleteRider) {
				action = 'deleteRider';
				rider2 = deleteRider;
			}

			const SQL = ` CALL commissaire.cyclist_update_contacts(
			${getFixedValue(req.user.user_name)},
			${getFixedValue(action)},
			${getFixedValue(rider2)},
			'${time}')`;
			//console.log(SQL);
			const response = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});

			if (!response) {
				return res
					.status(200)
					.send({ success: false, message: 'Error at save contacts' });
			} else {
				return res.status(200).send({
					success: true,
					user_id: response[1][0].user_id,
					contacts: response[0],
				});
			}
		} catch (e) {
			console.log('Error at contacts', e);
			return res.status(401).json({ message: 'Error at contacts' });
		}
	};

	//POST/api/cycling/config
	config = async (req, res) => {
		try {
			console.log('at config');
			const MINUTES_TO_REMOVE_OLD_RIDERS = config.MINUTES_TO_REMOVE_OLD_RIDERS;
			if (!req || !req.body || !req.user.user_name) {
				return res
					.status(200)
					.send({ success: false, message: 'Error no data' });
			}
			if (
				!req.user.cycling_Activated ||
				!req.user.is_register ||
				!req.user.is_active
			) {
				return res
					.status(200)
					.send({ success: false, message: 'Error: user is not activated' });
			}
			const userName = req.user.user_name;
			let user_id;
			const {
				type = 'rider',
				nick_name,
				mobile,
				from,
				to,
				puncture,
				can_help,
				difribliator,
				first_aid,
				water,
				some_data,
				is_private,
				need_help,
				time,
			} = req.body;

			// Call the stored procedure cyclist_update_config
			const SQL = `CALL commissaire.cyclist_update_config(
				${getFixedValue(userName)},
				${getFixedValue(type)},
				${getFixedValue(nick_name)},
				${getFixedValue(mobile)},
				${getFixedValue(from)},
				${getFixedValue(to)},
				${getFixedValue(puncture)},
				${getFixedValue(can_help)},
				${getFixedValue(difribliator)},
				${getFixedValue(first_aid)},
				${getFixedValue(water)},
				${getFixedValue(some_data)},
				${getFixedValue(is_private)},
				${getFixedValue(need_help)},
				'${time}')`;

			//console.log(SQL);
			const response = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});

			// Call the stored procedure cyclist_update_riders_to_0
			const spSQL = `CALL commissaire.cyclist_update_riders_to_0(${MINUTES_TO_REMOVE_OLD_RIDERS})`;
			await this.sequelize.query(spSQL, {
				type: QueryTypes.SELECT,
			});

			if (!response) {
				return res
					.status(200)
					.send({ success: false, message: 'Error at save config' });
			} else {
				return res.status(200).send({
					success: true,
				});
			}
		} catch (e) {
			console.log('Error at config', e);
			return res.status(401).json({ message: 'Error at config' });
		}
	};

	// POST/api/cycling/transmit
	callRidingStatus = async (req, res) => {
		try {
			if (!req || !req.body || !req.user.user_name) {
				return res.send({
					success: false,
					message: 'Error no data at location',
				});
			}
			if (
				!req.user.cycling_Activated ||
				!req.user.is_register ||
				!req.user.is_active
			) {
				return res.send({
					success: false,
					message: 'Error: user is not activated',
				});
			}
			const { mode } = req.body;
			console.log('mode', mode);
			const userName = req.user.user_name;
			const isRiding = mode === '1' ? 1 : 0;
			const SQL = `UPDATE commissaire.cycling_active
			SET is_riding = ${isRiding},
			server_time = NOW(),
			start_ride = CASE WHEN ${isRiding} = 1 THEN NOW() ELSE start_ride END
			WHERE rider_id = (SELECT id FROM users WHERE user_name = ${getFixedValue(
				userName,
			)});
			`;
			// const SQL = `UPDATE commissaire.cycling_active
			// 		set is_riding=${isRiding},server_time=now(),start_ride=now()
			// 		WHERE rider_id = (SELECT id FROM users WHERE user_name = ${getFixedValue(userName)});`;
			//console.log(SQL);
			let result = await this.sequelize.query(SQL, { type: QueryTypes.SELECT });
			return res.status(200).send(result);
		} catch (e) {
			console.log('Error at getRaceFields');
			return res.status(401).json({ message: 'Error at getRaceFields' });
		}
	};

	// POST/api/cycling/location
	location = async (req, res) => {
		console.log('at location.');

		try {
			if (!req || !req.body || !req.user.user_name) {
				return res.send({
					success: false,
					message: 'Error no data at location',
				});
			}
			if (
				!req.user.cycling_Activated ||
				!req.user.is_register ||
				!req.user.is_active
			) {
				return res.send({
					success: false,
					message: 'Error: user is not activated',
				});
			}
			// console.log(req.body);
			let {
				long,
				lat,
				time,
				heading,
				speed,
				timestamp,
				sender,
				inTransmitMode,
			} = req.body;

			timestamp =
				timestamp && timestamp != '0'
					? moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
					: '0';
			console.log(
				long,
				lat,
				time,
				heading,
				speed,
				timestamp,
				sender,
				inTransmitMode,
			);
			if (!long || !lat) {
				return res.send({
					success: false,
					message: 'Error: missing  data at location',
				});
			}
			console.log('at location long, lat, time ', long, lat, time);
			const SQL = ` CALL commissaire.cyclist_update_location(
				${getFixedValue(req.user.user_name)},
				${getFixedValue(long)},
				${getFixedValue(lat)},
				'${time}',
				${getFixedValue(heading)},
				${getFixedValue(speed)},
				${getFixedValue(timestamp)},
				${getFixedValue(sender)})`;

			//console.log(SQL);
			await this.sequelize.query(SQL, { type: QueryTypes.SELECT });
			return res.send({ success: true, message: 'ok' });
		} catch (err) {
			console.log('err', err);
			return res.send({ success: false, message: 'Error at location ' });
		}
	};
}
export default CyclingController;
