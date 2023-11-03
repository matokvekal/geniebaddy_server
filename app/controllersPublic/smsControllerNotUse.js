import { ServerLoginMessages } from '../constants/ServerMessages';
import sendSms from '../services/smsProviders/sendMsg';

class SmsController {
	// POST /sms/sendSms
	sendSms = async (req, res) => {
		try {
			const { phoneNumber, messageBody } = req.body;
			const result = await sendSms([phoneNumber], messageBody);
			if (result) {
				return res.send(result);
			}
			// return res.status(401).send({
			// 	message: ServerLoginMessages.FAILED_TO_SEND_SMS,
			// });
			res.createErrorLogAndSend({ message: ServerLoginMessages.FAILED_TO_SEND_SMS, status: 401 });
		} catch (err) {
			// res.status(500).send({
			// 	message: err.message || err,
			// });
			res.createErrorLogAndSend({ err });
		}
	};
}
export default SmsController;
