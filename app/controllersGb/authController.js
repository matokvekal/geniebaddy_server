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
			console.log('at login');
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
				user_name = user_name.toLowerCase();
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

					// console.log('user', user);
					if (!compare_passwords(password, user)) {
						return await res.createErrorLogAndSend({
							message: ServerLoginMessages.PASSWORD_IS_INCORRECT,
							status: 401,
						});
					}
					const user_name = user.user_name;
					const token = createToken(user_name, user_role);

					SQL = `
							UPDATE genie_users 
							SET last_login="${moment().format(
								'YYYY-MM-DD HH:mm:ss',
							)}", token=:token,last_active=UTC_TIMESTAMP() 
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
			return await res.createErrorLogAndSend({
				message: ServerLoginMessages.NO_DATA,
				status: 400,
			});
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
			console.log('at confirmCodeEmail');
			let { email, confirmationCode } = req.body.values;
			confirmationCode = confirmationCode.toString().trim();
			const user_name = email.toString().trim();
			if (!validateEmail(user_name)) {
				return await res.createErrorLogAndSend({
					message: ServerLoginMessages.EMAIL_NOT_VALID,
					status: 401,
				});
			}

			if (!confirmationCode.match(/^[0-9]{6}$/)) {
				return await res.createErrorLogAndSend({
					message: ServerLoginMessages.CONFITMATION_NOT_VALID,
					status: 200,
				});
			}
			const SQL = `SELECT * FROM genie_users  WHERE user_name like  '${user_name}' and is_register=0 `;
			//  and otp='${confirmationCode}' and otp_trys<10 `;

			const userResult = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			if (!userResult || !userResult[0]) {
				return await res.createErrorLogAndSend({
					message: ServerLoginMessages.USER_NOT_EXIST, //todo fix message
					status: 200,
				});
			} else if (userResult[0].otp !== confirmationCode) {
				return await res.createErrorLogAndSend({
					message: ServerLoginMessages.CONFITMATION_NOT_VALID, //todo fix message
					status: 200,
				});
			} else if (userResult[0].otp_trys > 9) {
				return await res.createErrorLogAndSend({
					message: ServerLoginMessages.TO_MANY_SMS_TRYS, //todo fix message
					status: 200,
				});
			} else {
				const SQL = `UPDATE genie_users set is_register=1,otp_trys=otp_trys+1,otp_sent_date='${moment().format(
					'YYYY-MM-DD HH:mm:ss',
				)}'  WHERE user_name like  '${user_name}'`;
				//update  to register and otp +1
				const userResult = await this.sequelize.query(SQL, {
					type: QueryTypes.UPDATE,
				});
				return res.status(200).send({ message: 'success' });
				//we will not use this approch for now
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
	validateName = (name) => {
		return (
			/^[a-zA-Z\u0080-\u024F\u0590-\u05FF\s\/\-\)\(\`\.\"\']+$/i.test(name) &&
			name.length <= 45
		);
	};

	validateMobile = (mobile) => {
		return /^[0-9+\/-]+$/.test(mobile);
	};
	//post localhost:5000/api/gb/registergenie
	registerGenie = async (req, res) => {
		try {
			const { email, password, firstName, lastName, mobile } = req.body;
			if (!firstName || !lastName || !mobile || !email || !password) {
				return await res.createErrorLogAndSend({
					message: ServerLoginMessages.NO_DATA,
					status: 400,
				});
			}
			if (email && password) {
				const user_name = email.toString().trim().toLowerCase();
				if (!validateEmail(user_name)) {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.EMAIL_NOT_VALID,
						status: 401,
					});
				}
				let SQL = `SELECT * FROM genie_users  WHERE 
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
				if (!this.validateName(firstName) || !this.validateName(lastName)) {
					return res.status(400).send({ message: 'Invalid name format' });
				}

				if (!this.validateMobile(mobile)) {
					return res.status(400).send({ message: 'Invalid mobile format' });
				}
				const hashed_password = hash_password(password);

				SQL = `
						INSERT INTO  genie_users
						( user_name,
							genie_email,
							user_role,
							password,
							comment,
							is_active,
							is_register,
							validation_date,
							mobile,
							genie_first_name,
							genie_last_name
							)
						 VALUES
					  (
						${getFixedValue(user_name)},
						${getFixedValue(user_name)},
						'genie',
						${getFixedValue(hashed_password)},
						"${password}",
						 1,
						 1,
						 "${moment().format('YYYY-MM-DD HH:mm:ss')}",
						 ${getFixedValue(mobile)},
						 ${getFixedValue(firstName)},
						 ${getFixedValue(lastName)}
															  )
					`;
				console.log('SQL', SQL);
				await this.sequelize.query(SQL, {
					type: QueryTypes.INSERT,
				});
				return res.status(200).send({ result: 'Saved' });
			}
			return await res.createErrorLogAndSend({
				message: 'Error in register',
				status: 400,
			});
		} catch (err) {
			return await res.createErrorLogAndSend({ err });
		}
	};
	//post localhost:5000/api/gb/registeruser
	registerUser = async (req, res) => {
		try {
			let sql_state = 'insert';
			const { email, password } = req.body;

			if (email && password) {
				const user_name = email.toString().trim().toLowerCase();
				if (!validateEmail(user_name)) {
					return await res.createErrorLogAndSend({
						message: ServerLoginMessages.EMAIL_NOT_VALID,
						status: 401,
					});
				}
				let SQL = `SELECT * FROM genie_users  WHERE 
				user_name =  '${user_name}' limit 1`;

				const userResult = await this.sequelize.query(SQL, {
					type: QueryTypes.SELECT,
				});
				if (userResult && userResult[0]) {
					if (
						userResult[0].is_active === 1 &&
						userResult[0].is_register === 1
					) {
						return res.status(200).send({
							message: ServerLoginMessages.USER_ALREADY_EXIST,
							status: 200,
						});
					}
					if (
						userResult[0].is_active === 0 &&
						userResult[0].is_register === 1
					) {
						return res.status(200).send({
							message: ServerLoginMessages.USER_CANT_REGISTER,
							status: 200,
						});
					}

					if (
						userResult[0].is_active === 1 &&
						userResult[0].is_register === 0
					) {
						if (
							moment().diff(moment(userResult[0].last_updated), 'minutes') < 20
						) {
							return res.status(200).send({
								message: ServerLoginMessages.TRY_LATER,
								status: 200,
							});
						} else {
							sql_state = 'update';
						}
					}
				}
				if (!validPassword(password.toString().trim())) {
					//Minimum eight characters, at least one uppercase letter, one lowercase letter and one number:
					return res.status(200).send({
						message: ServerLoginMessages.PASSWORD_NOT_VALID,
						status: 200,
					});
				}
				const hashed_password = hash_password(password);
				//new
				const { confirmationCode, lastConfirmationCodeDate } =
					createConfirmationCode();
				//new
				const emailResult = await sendConfirmationCodeByEmail(
					user_name,
					confirmationCode,
				);
				if (emailResult) {
					if (sql_state === 'update') {
						SQL = `UPDATE genie_users set
						password=${getFixedValue(hashed_password)},
						comment='${password}',
						is_active=1,
						is_register=0,
						validation_date='${moment().format('YYYY-MM-DD HH:mm:ss')}',
						otp='${confirmationCode}',
						create_at='${moment().format('YYYY-MM-DD HH:mm:ss')}',
						otp_trys=0,
						last_updated='${moment().format('YYYY-MM-DD HH:mm:ss')}'
						WHERE user_name = '${user_name}'`;
					} else {
						SQL = `
					INSERT INTO  genie_users
					( user_name,
						genie_email,
						user_role,
						password,
						comment,
						is_active,
						is_register,
						validation_date,
						otp,
						create_at,
						otp_trys,
						last_updated
						)
					 VALUES
				  (
					${getFixedValue(user_name)},
					${getFixedValue(user_name)},
		         'user',
					${getFixedValue(hashed_password)},
					'${password}',
					 1,
					 0,
					 '${moment().format('YYYY-MM-DD HH:mm:ss')}',
					 '${confirmationCode}',
					 '${moment().format('YYYY-MM-DD HH:mm:ss')}',
					 0,
					 '${moment().format('YYYY-MM-DD HH:mm:ss')}'
														  )
				`;
					}
					console.log('SQL', SQL);
					await this.sequelize.query(SQL, {
						type: QueryTypes.INSERT,
					});
					return res.status(200).send({
						message: 'sentOtpByMail',
					});
				}
			}
			return await res.createErrorLogAndSend({
				message: 'Error in register',
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
				let SQL = `SELECT * FROM users  WHERE user_name like  '${user_name}' and is_active=1 `;

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

				SQL = `UPDATE users set otp="${confirmationCode}"  WHERE user_name like  '${user_name}' and is_active=1 `;
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
				const SQL = `SELECT * FROM users  WHERE user_name like  '${user_name}' and is_active=1`;

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
					const SQL = `UPDATE users set last_login="${moment()}",password="${new_password}",otp_trys=0  WHERE user_name like  '${user_name}' and is_active=1 `;
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
