import nodemailer from 'nodemailer';
import config from '../config';

const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	auth: {
		user: config.gmailUserName,
		pass: config.gmailPassword,
	},
	secure: false, // use SSL
	port: 587, // port for secure SMTP
	tls: {
		rejectUnauthorized: false,
	},
});

export const sendMail = async (recipients, head, body, htmlContent = null) => {
	try {
		const result = await transporter.sendMail({
			from: config.gmailUserName, // sender address
			to: recipients.join(','), // list of receivers
			subject: head, // Subject line
			text: body, // plain text body
			html: htmlContent, // html body
		});
		return result;
	} catch (err) {
		console.error(`EMAIL ERROR - ${err}`);
		return false;
	}
};
