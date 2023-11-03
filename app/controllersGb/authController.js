import moment from 'moment';
import { Op } from 'sequelize';
import { validateEmail, validPassword } from '../common/helper';
// import getUserPermissions from '../common/getUserPermissions';
// import getUserRole from '../common/getUserRole';
import { ServerLoginMessages } from '../constants/ServerMessages';
import {
	compare_passwords,
	confirmConfirmationCode,
	createConfirmationCode,
	createToken,
	getFixedPhoneNumber,
	hash_password,
	sendConfirmationCodeByEmail,
	sendConfirmationCodeBySMS,
	sendResetPasswordLinkByEmail,
} from '../utils/authenticationUtils';
import BaseController from './baseController';
const { getFixedValue } = require('../utils/getFixedValues');

const { QueryTypes } = require('sequelize');

class AuthController extends BaseController {
	constructor(app, modelName) {
		super(app, modelName);
		this.modelName = modelName || 'genie_users';
	}

	// POST /api/gb/login
	login = async (req, res) => {
		try {
			console.log('login');
			let userResult;
			let user_name;
			const { phoneNumber, email, password, user_role } = req.body;
			if (email && password && user_role) {
				user_name = email.toString().trim();
				if (!validateEmail(user_name)) {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.EMAIL_NOT_VALID,
						status: 401,
					});
				}
				if (!validPassword(password.toString().trim())) {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.PASSWORD_NOT_VALID,
						status: 401,
					});
				}

				let SQL = `SELECT * FROM genie_users WHERE user_name = :user_name and is_register=1 and is_active=1 and user_role=:user_role`;
				userResult = await this.sequelize.query(SQL, {
					type: QueryTypes.SELECT,
					replacements: { user_name: user_name, user_role: user_role }, // Use replacements for parameters
				});
				if (!userResult || !userResult[0]) {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.PASSWORD_IS_INCORRECT,
						status: 401,
					});
				} else {
					let user = userResult[0];
					let user_role = userResult[0].user_role;

					console.log('user', user);
					if (!compare_passwords(password, user)) {
						return await res.createErrorLogAndSend({
							message: ServerLoginMessages.PASSWORD_IS_INCORRECT,
							status: 401,
						});
					}
					const user_name = user.user_name;
					const token = createToken(user_name, user_role);

					SQL = `
							UPDATE users 
							SET last_login="${moment().format('YYYY-MM-DD HH:mm:ss')}", token=:token
							WHERE user_name LIKE :user_name
							`;
					// console.log('SQL', SQL);
					userResult = await this.sequelize.query(SQL, {
						type: QueryTypes.UPDATE,
						replacements: {
							token: token,
							user_name: user_name,
						}, // Use replacements for parameters
					});

					res.cookie('token', token, { httpOnly: true }); // Send the token as a cookie
					return res.status(200).send({ token, user_name, user_role });
				}
			}
		} catch (err) {
			return await res.createErrorLogAndSend('Error at login');
		}
	};

	// POST /auth/confirmCode
	confirmCode = async (req, res) => {
		try {
			const { phoneNumber, confirmationCode } = req.body;
			const fixedPhoneNumber = getFixedPhoneNumber(phoneNumber);
			const usersResult = await this.dbModel.findAll({
				where: {
					user_name: fixedPhoneNumber,
				},
			});
			if (usersResult) {
				const user = usersResult[0];
				if (
					confirmConfirmationCode(
						confirmationCode,
						user.otp,
						user.otp_sent_date,
					)
				) {
					const token = createToken(user.user_name, user.user_role);
					await this.dbModel.update(
						{ last_login: moment() },
						{
							where: {
								user_name: phoneNumber,
							},
						},
					);
					// const roles = await getUserPermissions(
					// 	this.sequelize,
					// 	user
					// );
					const user_role = await getUserRole(this.sequelize, user);
					if (!user_role || user_role.length === 0) {
						return await res.createErrorLogAndSend({
							message: ServerLoginMessages.NO_USER_ROLE,
							status: 403,
						});
					}

					return res.send({
						token,
						user_role_object: user_role ? user_role[0] : null,
					});
				} else {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.WRONG_OTP,
						status: 401,
					});
				}
			}
			return await res.createErrorLogAndSend({
				message: ServerLoginMessages.CANT_FIND_USER,
				status: 401,
			});
		} catch (err) {
			return await res.createErrorLogAndSend({ err });
		}
	};
	// POST /api/auth/confirmCodeEmail
	confirmCodeEmail = async (req, res) => {
		try {
			console.log('confirmCodeEmail');
			const { email, confirmationCode } = req.body;
			// const user_name = email.toString().trim();
			const user_name = email.toString().trim();
			if (!validateEmail(user_name)) {
				return await res.createErrorLogAndSend({
					message: ServerLoginMessages.EMAIL_NOT_VALID,
					status: 401,
				});
			}
			const SQL = `SELECT * FROM users  WHERE user_name like  '${user_name}' and is_register=0 and otp='${confirmationCode}' and otp_trys<10 `;

			const userResult = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			if (!userResult || !userResult[0]) {
				return await res.createErrorLogAndSend({
					message: ServerLoginMessages.USER_NOT_EXIST, //todo fix message
					status: 401,
				});
			}
			if (userResult) {
				const user = userResult[0];
				if (
					confirmConfirmationCode(
						confirmationCode,
						user.otp,
						user.otp_sent_date,
					)
				) {
					const token = createToken(user.user_name, user.user_role);
					const SQL = `UPDATE users set last_login="${moment().format(
						'YYYY-MM-DD HH:mm:ss',
					)}",is_register=1,otp_trys=0,token="${token}"  WHERE user_name like  '${user_name}' `;
					const userResult = await this.sequelize.query(SQL, {
						type: QueryTypes.UPDATE,
					});

					return res.send({
						token,
						user_role_object: 'USER',
					});
				} else {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.WRONG_OTP,
						status: 401,
					});
				}
			}
			return await res.createErrorLogAndSend({
				message: ServerLoginMessages.CANT_FIND_USER,
				status: 401,
			});
		} catch (err) {
			return await res.createErrorLogAndSend({ err });
		}
	};

	loginWithToken = async (req, res) => {
		try {
			// this is from the middleware - 'authenticationMiddleware'
			if (req.user) {
				const userName = req.user.user_name || req.user.dataValues.user_name;
				await this.dbModel.update(
					{ last_login: moment() },
					{
						where: {
							user_name: userName,
						},
					},
				);
				return res.send(req.user.dataValues || req.user);
			}
			return await res.createErrorLogAndSend({
				message: ServerLoginMessages.ERROR_PARSING_TOKEN,
				status: 401,
			});
		} catch (err) {
			return await res.createErrorLogAndSend({ err });
		}
	};
	//post localhost:5000/api/gb/register
	register = async (req, res) => {
		try {
			const { email, password, mobile } = req.body;
			if (email && password) {
				const user_name = email.toString().trim();
				if (!validateEmail(user_name)) {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.EMAIL_NOT_VALID,
						status: 401,
					});
				}
				const SQL = `SELECT * FROM genie_users  WHERE 
				user_name =  '${user_name}'  and is_register=1 and is_active=1`;

				const userResult = await this.sequelize.query(SQL, {
					type: QueryTypes.SELECT,
				});
				if (userResult && userResult[0]) {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.USER_ALREADY_EXIST,
						status: 401,
					});
				}
				if (!validPassword(password.toString().trim())) {
					//Minimum eight characters, at least one uppercase letter, one lowercase letter and one number:
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.PASSWORD_NOT_VALID,
						status: 401,
					});
				}
				const hashed_password = hash_password(password);

				const { confirmationCode, lastConfirmationCodeDate } =
					createConfirmationCode();

				const emailResult = true;
				if (emailResult) {
					console.log(
						'email did not sent due to Google stop this service for not secured apps',
					);
				}
				if (emailResult) {
					let SQL = `
					INSERT INTO  genie_users
					( user_name,
						email,
						mobile,
						password,
						is_active,
						otp,
						validation_date,
						otp_trys,
						comment)
					 VALUES
				  (
					${getFixedValue(user_name)},
					${getFixedValue(user_name)},
					${getFixedValue(mobile)},
					${getFixedValue(hashed_password)},
					 1,
					${getFixedValue(confirmationCode)},
					${getFixedValue(lastConfirmationCodeDate)},
					 1,
					${getFixedValue(password)}
				  )
				`;
					// console.log('SQL', SQL);
					await this.sequelize.query(SQL, {
						type: QueryTypes.INSERT,
					});
					return res.status(200).send({ result: 'sentOtpByMail' });
				}
				return await res.createErrorLogAndSend({
					message: ServerLoginMessages.FAILED_TO_SEND_SMS_AND_EMAIL,
					status: 400,
				});
			}
			return await res.createErrorLogAndSend({
				message: ServerLoginMessages.NO_DATA,
				status: 400,
			});
		} catch (err) {
			return await res.createErrorLogAndSend({ err });
		}
	};

	forgot_password = async (req, res) => {
		try {
			const { email } = req.body;
			if (email) {
				const user_name = email.toString().trim();
				if (!validateEmail(user_name)) {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.EMAIL_NOT_VALID,
						status: 401,
					});
				}
				let SQL = `SELECT * FROM users  WHERE user_name like  '${user_name}' and is_active=1 and is_free=0`;

				let userResult = await this.sequelize.query(SQL, {
					type: QueryTypes.SELECT,
				});
				if (!userResult || !userResult[0]) {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.USER_NOT_EXIST,
						status: 401,
					});
				}
				//user need at least 15 minutes for each time to reset
				if (
					moment().diff(moment(userResult[0].last_reset_password), 'minutes') <
					15
					//NUMBER(config.last_reset_password ))
				) {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.ERORR,
						status: 401,
					});
				}
				const { confirmationCode, lastConfirmationCodeDate } =
					createConfirmationCode();

				SQL = `UPDATE users set otp="${confirmationCode}"  WHERE user_name like  '${user_name}' and is_active=1 and is_free=0`;
				//  SQL = `UPDATE users set last_reset_password="${moment()}"  WHERE user_name like  '${user_name}' and is_active=1` ;
				userResult = await this.sequelize.query(SQL, {
					type: QueryTypes.UPDATE,
				});
				return res.status(200).send({ confirmationCode: confirmationCode });
			}
			return await res.createErrorLogAndSend({
				message: ServerLoginMessages.NO_DATA,
				status: 400,
			});
		} catch (err) {
			return await res.createErrorLogAndSend({ err });
		}
	};

	//post localhost:5000/api/auth/reset_password
	reset_password = async (req, res) => {
		try {
			const { email, password, confirmationCode } = req.body;
			if (email && password && confirmationCode) {
				const user_name = email.toString().trim();
				if (!validateEmail(user_name)) {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.EMAIL_NOT_VALID,
						status: 401,
					});
				}
				const SQL = `SELECT * FROM users  WHERE user_name like  '${user_name}' and is_active=1 and is_free=0`;

				const userResult = await this.sequelize.query(SQL, {
					type: QueryTypes.SELECT,
				});
				if (!userResult || !userResult[0]) {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.USER_NOT_EXIST,
						status: 401,
					});
				}

				if (!validPassword(password.toString().trim())) {
					//Minimum eight characters, at least one uppercase letter, one lowercase letter and one number:
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.PASSWORD_NOT_VALID,
						status: 401,
					});
				}
				const new_password = hash_password(password);

				if (
					confirmConfirmationCode(
						confirmationCode,
						userResult[0].otp,
						userResult[0].otp_sent_date,
					)
				) {
					const token = createToken(user_name, userResult[0].user_role);
					const SQL = `UPDATE users set last_login="${moment()}",password="${new_password}",otp_trys=0  WHERE user_name like  '${user_name}' and is_active=1 and is_free=0`;
					const userResult = await this.sequelize.query(SQL, {
						type: QueryTypes.UPDATE,
					});
				}

				return res.status(200).send({ result: true });
			}
			return await res.createErrorLogAndSend({
				message: ServerLoginMessages.NO_DATA,
				status: 400,
			});
		} catch (err) {
			return await res.createErrorLogAndSend({ err });
		}
	};
}
export default AuthController;
