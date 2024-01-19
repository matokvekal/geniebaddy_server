import { sendMail } from './mailUtils';

// export const sendMail = async (recipients, head, body) => {
// 	try {
// 		const result = await transporter.sendMail({
// 			from: config.gmailUserName, // sender address
// 			to: recipients.join(','), // list of receivers
// 			subject: head, // Subject line
// 			text: body, // plain text body
// 			// html: "", // html body
// 		});
// 		return result;
// 	} catch (err) {
// 		console.error(`EMAIL ERROR - ${err}`);
// 		return false;
// 	}
// };

export const sendMauilToAdmin = async () => {
	// const email = 'mictavim@gmail.com';
	//select count* from
	return await sendMail(
		'shareistheplace@gmail.com',
		'New user registered',
		`total users: ${users}, total genies: ${genies}`,
	);
};

export const sendEmailToUser = async (email, user_nickname, genie_nickname) => {
	try {
		const htmlContent = `
		<p>Hello ${user_nickname},</p>
		<p>Exciting news! ${genie_nickname}, a fellow member of our SHARE community, has read your post and shared a thoughtful response just for you.</p>
		<p>Eager to see what they have to say? Click the button below to explore their message:</p>
		<a href="https://commissaire.us/loginuser/refresh" 
			style="background-color: #4CAF50; 
					 color: white; 
					 padding: 10px 20px; 
					 text-align: center; 
					 text-decoration: none; 
					 display: inline-block; 
					 font-size: 16px; 
					 margin: 10px 0; 
					 cursor: pointer; 
					 border-radius: 5px;">
			 View Response
		</a>
	`;

		return await sendMail(
			[email],
			`${genie_nickname} answered your post at SHARE`, // Corrected subject line
			'You have a new response on SHARE.', // Text body
			htmlContent,
		);
	} catch (err) {
		console.log(err);
	}
};

/* <p>Dear ${user_nickname},</p>
<p>We're delighted to let you know that ${genie_nickname}, someone who understands and cares, has responded to your post on SHARE. They've shared their insights and thoughts with you.</p>
<p>Curious to read their message? Simply click the button below to connect:</p>
<a href="https://commissaire.us/loginuser" 
   style="background-color: #4CAF50; 
          color: white; 
          padding: 10px 20px; 
          text-align: center; 
          text-decoration: none; 
          display: inline-block; 
          font-size: 16px; 
          margin: 10px 0; 
          cursor: pointer; 
          border-radius: 5px;">
    Discover Their Words
</a> */

/* <p>Hello ${user_nickname},</p> */
/* <p>Your post on SHARE has sparked a connection! ${genie_nickname}, another compassionate individual in our community, has read your thoughts and left a personal response.</p>
<p>Ready to dive into their heartfelt message? Click the button below and join the conversation:</p>
<a href="https://commissaire.us/loginuser" 
   style="background-color: #4CAF50; 
          color: white; 
          padding: 10px 20px; 
          text-align: center; 
          text-decoration: none; 
          display: inline-block; 
          font-size: 16px; 
          margin: 10px 0; 
          cursor: pointer; 
          border-radius: 5px;">
    Check Your Response
</a> */

{
	/* <p>Hello ${user_nickname},</p>
<p>You've received a response from ${genie_nickname}, one of our caring SHARE volunteers. They've carefully read your post and shared their thoughts just for you.</p>
<p>Ready to see their message? Just click the button below and dive into the conversation:</p>
<a href="https://commissaire.us/loginuser" 
   style="background-color: #4CAF50; 
          color: white; 
          padding: 10px 20px; 
          text-align: center; 
          text-decoration: none; 
          display: inline-block; 
          font-size: 16px; 
          margin: 10px 0; 
          cursor: pointer; 
          border-radius: 5px;">
    Check Your Response
</a> */
}

// <p>Dear ${user_nickname},</p>
// <p>We're excited to inform you that ${genie_nickname}, a dedicated member of our SHARE community, has taken the time to respond to your post. Their message awaits you!</p>
// <p>Curious about what they've said? Click the button below to find out:</p>
// <a href="https://commissaire.us/loginuser"
//    style="background-color: #4CAF50;
//           color: white;
//           padding: 10px 20px;
//           text-align: center;
//           text-decoration: none;
//           display: inline-block;
//           font-size: 16px;
//           margin: 10px 0;
//           cursor: pointer;
//           border-radius: 5px;">
//     Discover Response
// </a>
