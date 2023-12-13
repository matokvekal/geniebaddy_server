import moment from 'moment';
const os = require('os');
const osu = require('node-os-utils');

export const getLogRecordData = (req) => {

	console.log("at getLogRecordData");
	let cpu = osu.cpu;
	var current = cpu.average();
	return {
		user_name: null,
		owner_id: null,
		date: moment().toDate(),
		ip: `${req.socket.remoteAddress}`,
		path: `${req.path}`,
		cpu: `CPU Usage (%):  ${JSON.stringify(current)}`,
		memory:`${Math.floor(os.freemem() / 1000000)}/${Math.floor(os.totalmem() / 1000000)}`,
	};
};

export const getErrorLogRecordData = (req, error) => {
	//ERRORTEST this is temporary return to test the erros at db 04-12-2023
	console.log("at getErrorLogRecordData");
	return {
		...getLogRecordData(req),
		err: error,
	};
};

export const createErrorLog = async (db, req, error) => {
	console.log("at createErrorLog");
	//ERRORTEST this is temporary return to test the erros at db 04-12-2023

	console.log("at createErrorLog");
	const errorLogData = getErrorLogRecordData(req, error);
	return await db.logs.create({ ...getLogRecordData(req),  ...errorLogData });
};





export const createSingleLog = async (db, req, message) => {
	return await db.logs.create({ ...getLogRecordData(req), message });
};
//how to use
// // const updateRequsetLogs = async(db,req,current_request_amount_per_minutes,current_request_amount_per_day=0)=>{
// //   await db.user.update({ current_request_amount_per_minutes,current_request_amount_per_day, current_request_time: new Date()}, {
// //     where: {
// //       user_name: req.user.user_name,
// //       owner_id: req.owner_id,
// //     }
// //   });
// //   await createSingleLog(db,req, `User: ${req.user.user_name},per_minutes:${current_request_amount_per_minutes},per_day:${current_request_amount_per_day}` );
// // }
