import config from "../../config";
import axios from "axios";

const sendSms = async (phoneNumbersToSendTo = [], messageBody) => {
  try {
    const siteID = config.smsSiteID;
    const password = config.smsSitePassword;
    const tokenResult = await axios.post(
      "http://gconvertrest.sendmsg.co.il/api/sendMsg/token?full=true",
      {
        siteID,
        password,
      }
    );
    const { Token, Active } = tokenResult.data.ActiveToken;
    if (Token && Active) {
      const SenderPhone = config.smsSenderPhone;
      const MessageInnerName = config.smsMessageInnerName;
      const Users = phoneNumbersToSendTo.map((phoneNumber) => {
        return { Cellphone: phoneNumber };
      });
      const sendSmsResult = await axios.post(
        "https://gconvertrest.sendmsg.co.il/api/Sendmsg/AddUsersAndSendSMS",
        {
          Users,
          Message: {
            MessageContent: messageBody,
            SenderPhone,
            MessageInnerName,
            MessageSubject: "",
            MessageType: 1,
            TypeSms: 2,//1 is short sms  2-long
          },
        },
        {
          headers: {
            Authorization: Token,
          },
        }
      );
      const { success } = sendSmsResult.data;
      //return success;
	  return true;//todo fix sms
    }
    return false;
  } catch (err) {
    console.error("problem with SMS sender");
    return false;
  }
};

export default sendSms;
