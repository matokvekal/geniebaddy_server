// import config from '../config';
// import cron from 'node-cron';
// import { createSingleLog } from '../utils/apiLoggerUtils';

// const {
// 	allowedAmountOfRequestsForIpPerMinute,
// 	allowedAmountOfRequestsForIpPerFullDay,
// } = config;

// const MINUTE_CRON_FORMAT = '*/1 * * * *';
// const DAY_CRON_FORMAT = '0 0 */24 * * *';

// const ERR_TOO_MANY_REQUESTS_MIN = 'TOO MANY REQUESTS IN A MINUTE';
// const ERR_TOO_MANY_REQUESTS_DAY = 'TOO MANY REQUESTS IN 24 HOURS';

// let minuteRequests = {};
// let fullDayRequests = {};

// const incrementOrInitialize = (obj, key) => {
// 	obj[key] = obj[key] ? obj[key] + 1 : 1;
// };

// cron.schedule(MINUTE_CRON_FORMAT, () => {
// 	minuteRequests = {};
// });

// cron.schedule(DAY_CRON_FORMAT, () => {
// 	fullDayRequests = {};
// });

// const blockAndLogUser = async (req, db, additionalData) => {
// 	const { user, owner_id } = req;
// 	if (user && owner_id) {
// 		await db.user.update(
// 			{
// 				blocked: 1,
// 				block_date: new Date(),
// 				...additionalData,
// 			},
// 			{
// 				where: {
// 					user_name: user.user_name,
// 					owner_id,
// 				},
// 			},
// 		);
// 		await createSingleLog(
// 			db,
// 			req,
// 			`User: ${user.user_name}, per_minute:${
// 				minuteRequests[user.user_name]
// 			}, per_day:${fullDayRequests[user.user_name]}`,
// 		);
// 	}
// };

// const userRequestRateLimiter = (db) => async (req, res, next) => {
// 	try {
// 		const { user } = req;
// 		if (!user) return next();

// 		if (user.blocked) {
// 			throw { message: `USER ${user.user_name} IS BLOCKED`, status: 403 };
// 		}

// 		const userNameKey = user.user_name;
// 		incrementOrInitialize(minuteRequests, userNameKey);
// 		incrementOrInitialize(fullDayRequests, userNameKey);

// 		if (minuteRequests[userNameKey] > allowedAmountOfRequestsForIpPerMinute) {
// 			await blockAndLogUser(req, db, {
// 				requestsPerMinute: minuteRequests[userNameKey],
// 			});
// 			throw { message: ERR_TOO_MANY_REQUESTS_MIN, status: 429 };
// 		}

// 		if (fullDayRequests[userNameKey] > allowedAmountOfRequestsForIpPerFullDay) {
// 			await blockAndLogUser(req, db, {
// 				requestsPerDay: fullDayRequests[userNameKey],
// 			});
// 			throw { message: ERR_TOO_MANY_REQUESTS_DAY, status: 429 };
// 		}

// 		next();
// 	} catch (err) {
// 		res.createErrorLogAndSend({
// 			message: err.message,
// 			status: err.status || 429,
// 		});
// 	}
// };

// export default userRequestRateLimiter;

// // import config from '../config';
// // import cron from "node-cron";
// // // const { QueryTypes } = require('sequelize');
// // // const db = require("./../models");

// // import {
// // 	createSingleLog,
// // 	createLogs,
// // } from '../utils/apiLoggerUtils';

// // const allowedAmountOfRequestsForIpPerMinute = config.allowedAmountOfRequestsForIpPerMinute;
// // // const allowedAmountOfRequestsForIpPerMinute = 5;
// // const allowedAmountOfRequestsForIpPerFullDay = config.allowedAmountOfRequestsForIpPerFullDay;

// // const minuteCronExecuteFormat = '*/1 * * * *';
// // const dayCronExecuteFormat = '0 0 */24 * * *';

// // let minuteDictionary = {};
// // let fullDayDictionary = {};

// // const addOrSetValueToObject = (object, key, value) => {
// //   if (object[key]) {
// //     object[key] += value;
// //   } else {
// //     object[key] = value;
// //   }
// // }

// // cron.schedule(minuteCronExecuteFormat, () => {
// //   minuteDictionary = {};
// // });

// // cron.schedule(dayCronExecuteFormat, () => {
// //   fullDayDictionary = {};
// // });

// // const blockUser = async (req, db, restData) => {
// //   if (req.user && req.owner_id) {
// //     await db.user.update({ blocked: 1, block_date: new Date(), ...restData }, {
// //       where: {
// //         user_name: req.user.user_name,
// //         owner_id: req.owner_id,
// //       }
// //     });
// //   }
// // }

// // const updateRequsetLogs = async(db,req,current_request_amount_per_minutes,current_request_amount_per_day=0)=>{
// //   await db.user.update({ current_request_amount_per_minutes,current_request_amount_per_day, current_request_time: new Date()}, {
// //     where: {
// //       user_name: req.user.user_name,
// //       owner_id: req.owner_id,
// //     }
// //   });
// //   await createSingleLog(db,req, `User: ${req.user.user_name},per_minutes:${current_request_amount_per_minutes},per_day:${current_request_amount_per_day}` );
// // }
// // const shouldCheck = true;

// // const userReqAmountCheckMiddleware = (db) => async (req, res, next) => {
// //   try {
// //     if (shouldCheck && req.user) {
// //       // if the user is not blocked
// //       if (!req.user.blocked) {
// //         const key = req.user.user_name;

// //         await updateRequsetLogs(db,req,minuteDictionary[key],fullDayDictionary[key])
// //         if (!minuteDictionary[key] || minuteDictionary[key] < allowedAmountOfRequestsForIpPerMinute) {
// //           addOrSetValueToObject(minuteDictionary, key, 1);
// //         } else {
// //           await blockUser(req, db, { requestsPerMinute: minuteDictionary[key] });
// //           throw 'TOO MANY REQUESTS IN A MINUTE';
// //         }
// //         if (!fullDayDictionary[key] || fullDayDictionary[key] < allowedAmountOfRequestsForIpPerFullDay) {
// //           addOrSetValueToObject(fullDayDictionary, key, 1);
// //         } else {
// //           await blockUser(req, db, { requestsPerDay: fullDayDictionary[key] });
// //           throw 'TOO MANY REQUESTS IN 24 HOURS';
// //         }
// //         return next();
// //       }
// //       throw { message: `USER ${req.user.user_name} IS BLOCKED AND CANNOT COMPLETE THE REQUEST`, status: 403 };
// //     }
// //     return next();
// //   } catch (err) {
// //     res.createErrorLogAndSend({ message: `${err.message || err}`, status: err.status || 429 });
// //   }
// // };

// // export default userReqAmountCheckMiddleware;
