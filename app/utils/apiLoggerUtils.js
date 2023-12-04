import moment from 'moment';
const os = require('os');
const osu = require('node-os-utils');

var config = require('../config/index');
let creationArr = [];
let timer;

export const getLogRecordData = (req) => {
	//ERRORTEST this is temporary return to test the erros at db 04-12-2023
	return;
	console.log("at getLogRecordData");
	const userName = req && req.user ? req.user.user_name : 'NO USER';
	let cpu = osu.cpu;
	var current = cpu.average();
	return {
		user_name: userName,
		owner_id: req.owner_id,
		date: moment().toDate(),
		ip: `${req.socket.remoteAddress}`,
		path: `${req.path}`,
		// cpu: `CPU Usage (%):  ${JSON.stringify(current)}`,
		// memory:`${Math.floor(os.freemem() / 1000000)}/${Math.floor(os.totalmem() / 1000000)}`,
	};
};

export const getErrorLogRecordData = (req, error) => {
	//ERRORTEST this is temporary return to test the erros at db 04-12-2023
	return;
	console.log("at getErrorLogRecordData");
	return {
		...getLogRecordData(req),
		err: error,
	};
};

export const createErrorLog = async (db, req, error) => {
	//ERRORTEST this is temporary return to test the erros at db 04-12-2023
	return;
	console.log("at createErrorLog");
	const errorLogData = getErrorLogRecordData(req, error);
	return await db.logs.create({ ...getLogRecordData(req),  ...errorLogData });
};

export const loggerDebounce = (func, timeout = 300) => {
	//ERRORTEST this is temporary return to test the erros at db 04-12-2023
	return;
	console.log("at loggerDebounce");
	return (...args) => {
		clearTimeout(timer);
		const req = args[0];
		const logData = getLogRecordData(req);
		creationArr.push(logData);
		timer = setTimeout(() => {
			func.apply(this, args);
			creationArr = [];
		}, timeout);
	};
};

export const createLogs = async (db) => {
	//ERRORTEST this is temporary return to test the erros at db 04-12-2023
	return;
	console.log("at createLogs");
	if (creationArr && creationArr.length) {
		await db.logs.bulkCreate(creationArr);
	}
};

export const debouncedCreateLogs =
		(action = createLogs) =>
		(req, db) => {
			console.log("at debouncedCreateLogs");
				//ERRORTEST this is temporary return to test the erros at db 04-12-2023
	return;
			loggerDebounce(
				async () => await action(db),
				config.loggerDebounceAmountInMS
			)(req);
		};

export const createDebouncerForLogAction = (createLogAction) => {
	return debouncedCreateLogs(createLogAction);
};

export const createSingleLog = async (db, req, message) => {
	return await db.logs.create({ ...getLogRecordData(req), message });
};
