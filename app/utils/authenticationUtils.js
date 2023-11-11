import moment, { months } from 'moment';
import jwt from 'jsonwebtoken';
import config from '../config';
import sendSms from '../services/smsProviders/sendMsg';
import { sendMail } from './mailUtils';
import bcrypt from 'bcryptjs';

const salt = bcrypt.genSaltSync(config.passwordIncryptSalt);

export const createConfirmationCode = () => {
	const confirmationCode = Math.floor(1000 + Math.random() * 900000);
	return { confirmationCode, lastConfirmationCodeDate: moment() };
};

export const sendConfirmationCodeBySMS = async (
	phoneNumber,
	confirmationCode,
) => {
	const result = await sendSms(
		[phoneNumber],
		`Your Confirmation Code: ${confirmationCode}`,
	);
	if (result) {
		return confirmationCode;
	}
	return result;
};

export const confirmConfirmationCode = (
	confirmationCode,
	lastConfirmationCode,
	lastConfirmationCodeDate,
) => {
	const amountOfTimeAllowedInMinutes = config.confirmationCodeLimit;
	return (
		// checks its the same code and that 5 minutes didnt pass
		lastConfirmationCode === confirmationCode &&
		moment().diff(moment(lastConfirmationCodeDate), 'minutes') <
			amountOfTimeAllowedInMinutes
	);
};

export const createToken = (user_name, user_role = null) => {
	const token = jwt.sign(
		{
			user_name: user_name,
			last_login: moment(),
			free: false,
			user_role: user_role,
		},
		config.TOKEN_KEY,
		{
			expiresIn: `${config.tokenExpireDayLimit}d`,
		},
	);
	return token;
};
export const generateToken = (payload) => {
	const token = jwt.sign(payload, config.TOKEN_KEY, {
		expiresIn: `${config.tokenExpireDayLimit}d`,
	});
	return token;
};

export const getTokenFromReq = (req) => {
	return req.body.token || req.query.token || req.headers['token'];
};

export const getEnv = () => {
	return process.env.MODE_ENV || 'development'; //for local dev by pass login
};

export const getFixedPhoneNumber = (phoneNumber) => {
	return phoneNumber && phoneNumber[3] === '0'
		? phoneNumber
		: `${phoneNumber.slice(0, 3)}0${phoneNumber.slice(3)}`;
};

export const sendConfirmationCodeByEmail = async (email, confirmationCode) => {
	return await sendMail(
		[email],
		'Commissaire Confirmation Code',
		`Your Confirmation Code: ${confirmationCode}`,
	);
};

export const hash_password = (password) => {
	return bcrypt.hashSync(password, salt);
};

export const compare_passwords = (password, user_from_db) => {
	return bcrypt.compareSync(password, user_from_db.password);
};

export const sendResetPasswordLinkByEmail = async (email, link) => {
	return await sendMail(
		[email],
		'Commissaire RESET PASSWORD',
		`Link for reseting password: ${link}`,
	);
};
