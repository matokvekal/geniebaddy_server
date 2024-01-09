import { ServerLoginMessages } from '../constants/ServerMessages';
import jwt from 'jsonwebtoken';
import config from '../config';
const _ = require('lodash');
import {
	getFixedPhoneNumber,
	getTokenFromReq,
	getEnv,
	createToken,
} from '../utils/authenticationUtils';
import { Op, QueryTypes } from 'sequelize';
// import moment from 'moment';
// import { Op } from 'sequelize';
// import moment from 'moment';
// import getUserRole from '../common/getUserRole';
// const { QueryTypes } = require('sequelize');

const bypassPathsWhiteList = [
	'/auth/login',
	'/api/gb/login',
	'/auth/confirmCode',
	'/auth/registeruser',
	'/auth/registergenie',
	'/auth/forgot_password',
	'/auth/reset_password',
	'/auth/signUpPublic',
	'/free',
	// '/gb',
];
const bypassEnvsWhiteList = ['local'];

const bypass = async (req, db) => {
	log("at bypass")
	console.log(bypassPathsWhiteList)
	const isPathCanBypass = bypassPathsWhiteList.find(
		(allowedPath) =>
			req.originalUrl.includes(allowedPath) ||
			req.baseUrl.includes(allowedPath),
		// req.path.includes(allowedPath) || req.baseUrl.includes(allowedPath),
	);
	console.log('isPathCanBypass', isPathCanBypass);
	if (!isPathCanBypass) {
		const env = getEnv();
		console.log('env bypass', env);
		const isEnvCanBypass = bypassEnvsWhiteList.includes(env);
		if (isEnvCanBypass && db.control) {
			const canBypassLoginFromDbResult = await db.control.findAll({
				where: {
					key: 'canBypassLogin',
				},
				raw: true,
			});
			if (canBypassLoginFromDbResult && canBypassLoginFromDbResult.length) {
				return (
					canBypassLoginFromDbResult[0].value === '1' &&
					canBypassLoginFromDbResult[0].owner_id === 1 &&
					isEnvCanBypass
				);
			}
			return isEnvCanBypass;
		}
		return isEnvCanBypass;
	}
	return isPathCanBypass;
};

async function logUsers(userName, token, req, db) {
	//ERRORTEST this is temporary return to test the erros at db 04-12-2023
	return;
	await db.log_users.create({
		user_name: userName,
		ip: JSON.stringify(req.client._peername),
		path: req.path,
		payload: JSON.stringify(req.body || null),
		user_agent: req.headers['user-agent'],
		token: token,
		query: JSON.stringify(req.query || null),
		width: Number(req.headers['width']),
	});
}
const authenticationMiddleware = (db) => async (req, res, next) => {
	const canBypass = await bypass(req, db);
	if (canBypass) {
		req.canBypass = true;
		return next();
	}

	let token = req.headers.authorization;

	// console.log('at authenticationMiddleware ', accessToken)
	let user_name = null;

	if (token) {
		try {
			const accessToken = req.headers.authorization.trim().split(' ')[1];
			const verifiedTokenValue = jwt.verify(accessToken, config.TOKEN_KEY);
			const { last_login, user_name, user_role } = verifiedTokenValue;

			if (last_login) {
				const SQL = `SELECT * FROM genie_users WHERE user_name = :userName AND :lastLoginDate >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)`;
				const [userRsult, metadata] = await db.sequelize.query(SQL, {
					replacements: {
						userName: user_name,
						lastLoginDate: last_login,
					},
					type: db.sequelize.QueryTypes.SELECT,
				});

				const validFoundUser =
					userRsult && userRsult.id > 0
						? userRsult.length > 0
							? userRsult[0]
							: userRsult
						: null;
				if (!validFoundUser) {
					if (!canBypass) {
						return await res.createErrorLogAndSend({
							message: ServerLoginMessages.INVALID_TOKEN,
							status: 403,
						});
					} else {
						req.canBypass = true;
						return next();
					}
				}

				req.user = {
					user_name: validFoundUser.user_name,
					user_role: validFoundUser.user_role,
					id: validFoundUser.id,
					mobile: validFoundUser.mobile,
					name: validFoundUser.name,
				};
			}
			logUsers(req.user.user_name, token, req, db);
			return next();
		} catch (err) {
			if (!canBypass) {
				logUsers(ServerLoginMessages.INVALID_TOKEN, token, req, db);
				return await res.createErrorLogAndSend({
					err,
					message: ServerLoginMessages.INVALID_TOKEN,
					status: 403,
				});
			} else {
				logUsers(req.user.user_name, 'canBypass', req, db);
				req.canBypass = true;
				return next();
			}
		}
	} else {
		return await res.createErrorLogAndSend({
			message: ServerLoginMessages.TOKEN_REQUIRED,
			status: 403,
		});
	}
	// req.canBypass = true;
	// return next();
};

export default authenticationMiddleware;
