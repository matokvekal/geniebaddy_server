import BaseController from './baseController';
const { QueryTypes } = require('sequelize');
const { getFixedValue } = require('../utils/getFixedValues');
// import moment from 'moment';
import { CON, postStatus } from '../constants/jenie';
import config from '../config/config.json';

class GenieController extends BaseController {
	constructor(app, modelName, sequelize) {
		super(app, modelName, sequelize);
	}

	genieInfo = async (userId) => {
		const SQL = `select * from genie_users where id = :userId and is_active=1 and blocked=0 and user_role='genie'`;
		const result = await this.sequelize.query(SQL, {
			replacements: {
				userId: userId,
			},
			type: QueryTypes.SELECT,
		});
		return result;
	};
	// GET /gb/genieposts
	genieGetPosts = async (req, res) => {
		console.log('at genieGetPosts');
		const user = req.user;
		const userId = user.id;
		if (!userId) {
			return res.status(400).json({ error: 'No user id' });
		}

		let resp = {};
		try {
			const SQL = `SELECT id, post_status, created_at, topic_id, user_header, user_1, user_3_date
				genie_1, user_2, genie_2, user_3, genie_3, user_1_date, user_2_date, 
				user_3_date, genie_1_date, user_2_date, genie_2_date,rating,user_avatar,genie_avatar
				FROM genie_posts WHERE genie_id = ${userId} and post_status!='${postStatus.NEW}'`;

			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});

			return res.send({
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while genieInfo',
			});
		}
	};
	// POST /gb/genieChoosePost
	genieChoosePost = async (req, res) => {
		console.log('at genieChoosePost');
		const user = req.user;
		const userId = user.id;
	
		const { postId,avatar} = req.body;
		console.log(' post id =', postId);
		if (!userId || !postId) {
			return res.status(400).json({ error: 'No post  id' });
		}

		let resp = {};
		try {
			let SQL = `update genie_posts set post_status='${postStatus.OPEN}',genie_id=${userId},status_time=UTC_TIMESTAMP(),genie_avatar:genie_avatar where id=:postId and post_status='${postStatus.HOLD}'`;
			// console.log('SQL1	', SQL);
			await this.sequelize.query(SQL, {
				replacements: { postId: postId,genie_avatar:avatar?avatar:0 },
				type: QueryTypes.UPDATE,
			});

			SQL = `update genie_posts set post_status='${postStatus.NEW}',genie_id=0,status_time=UTC_TIMESTAMP() where genie_id=${userId} and post_status='${postStatus.HOLD}'`;
			// console.log('SQL2	', SQL);
			await this.sequelize.query(SQL, {
				type: QueryTypes.UPDATE,
			});

			SQL = `UPDATE genie_users SET genie_answer_count=genie_answer_count+1, genie_answer_count_date=UTC_TIMESTAMP() WHERE id=?`;
			// console.log('SQL3	', SQL);
			await this.sequelize.query(SQL, {
				replacements: [userId],
				type: QueryTypes.UPDATE,
			});
			return res.status(200).send({
				message: 'ok',
			});
		} catch (e) {
			console.log(e);
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while genieChoosePost',
			});
		}
	};

	// GET /gb/genienewposts
	genieGetNewPosts = async (req, res) => {
		console.log('at genieGetNewPosts');
		try {
			const userId = req.user.id;
			const info = await this.genieInfo(userId);

			let resultTotal = [];
			if (!info || !info[0]) {
				return res.status(400).json({ error: 'No genie info' });
			}
			const genieData = info[0];
			const genieTopics = genieData.preferred_topics;
			if (!genieTopics) {
				return res.status(400).json({ error: 'No genie topics' });
			}
			const watched = genieData.genie_watching_ids;
			const leftWatch =
				CON.MAX_GENIE_WATCH - (watched ? watched.split(',').length : 0);

			const leftAnswerMessages =
				CON.MAX_GENIE_ANSWER -
				(genieData.genie_answer_count
					? Number(genieData.genie_answer_count)
					: 0);

			if (leftAnswerMessages <= 0) {
				return res.json({
					error: 'You have answered 10 times today, please wait for tomorrow',
				});
			}
			const transaction = await this.sequelize.transaction();
			try {
				//if genie watch today>0 select (if its new ) to res 1
				//if watch today<10 so select  new with same topit limit   10-watch today they new and  ginie=0but the id not in watch1
				//after select do the update

				//select chats the genie allredy watch tody and the or new or in hold
				if (leftWatch < CON.MAX_GENIE_WATCH) {
					let SQL = `SELECT id, post_status, created_at, topic_id, user_header, user_1, user_1_date, user_nickname
				FROM genie_posts 
				WHERE is_active=1 AND is_block=0 AND id IN (${watched})
				AND (post_status='${postStatus.NEW}' OR (genie_id=${userId} AND post_status='${postStatus.HOLD}'))`;
					const result1 = await this.sequelize.query(SQL, {
						type: QueryTypes.SELECT,
					});
					if (result1 && result1.length > 0) {
						resultTotal = result1;
					}
				}
				//select new chats to complite total up to 10 that are similar to genieTopics
				if (leftWatch > 0) {
					let SQL = `SELECT id, post_status, created_at, topic_id, user_header, user_1, user_1_date, user_nickname
				FROM genie_posts WHERE is_active=1 AND is_block=0 AND post_status='${postStatus.NEW}'`;
					if (genieTopics && genieTopics.length > 0) {
						SQL += ` AND topic_id IN (${genieTopics})`;
					}
					if (resultTotal && resultTotal.length > 0) {
						const allredyWatch = resultTotal.map((row) => row.id).join(',');
						SQL += ` AND id NOT IN (${allredyWatch})`;
					}
					SQL += ` LIMIT ${leftWatch}`;

					let result2 = await this.sequelize.query(SQL, {
						type: QueryTypes.SELECT,
					});
					if (result2 && result2.length > 0) {
						resultTotal = resultTotal.concat(result2);
					}
				}
				if (resultTotal.length > 0) {
					if (resultTotal && resultTotal.length > 0) {
						let SQL = `update genie_posts set post_status="hold",genie_id=${userId},status_time=UTC_TIMESTAMP() where id in (${resultTotal.map(
							(row) => row.id,
						)})`;

						await this.sequelize.query(SQL, {
							type: QueryTypes.UPDATE,
							transaction,
						});
						const watchingIdsString = resultTotal
							.map((row) => row.id)
							.join(',');
						SQL = `UPDATE genie_users SET genie_watching_ids=?, genie_watching_id_date=UTC_TIMESTAMP() WHERE id=?`;
						await this.sequelize.query(SQL, {
							replacements: [watchingIdsString, userId],
							type: QueryTypes.UPDATE,
							transaction,
						});
					}
					await transaction.commit();
					const result = resultTotal.map((row) => {
						return {
							id: row.id,
							post_status: row.post_status,
							created_at: row.created_at,
							topic_id: row.topic_id,
							user_header: row.user_header,
							user_1: row.user_1,
							user_1_date: row.user_1_date,
						};
					});
					console.log('result', result.length);
					return res.send({ result });
				} else {
					return res.send({
						message: 'No new messages today, please wait for tomorrow',
					});
				}
			} catch (e) {
				// Rollback the transaction in case of an error
				await transaction.rollback();
				return res.createErrorLogAndSend({
					err: e,
					message: 'Some error occurred genieGetNewPosts',
				});
			}
		} catch (e) {
			await transaction.rollback();
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred genieGetNewPosts',
			});
		}
	};
	/////////////
	// try {
	// 	let resultTotal = [];
	// 	//select chats the genie allredy watch tody and the or new or in hold
	// 	if (leftWatch > 0) {
	// 		let SQL = `SELECT id, post_status, created_at, topic_id, user_header, user_1, user_1_date, user_nickname
	// 				 FROM genie_posts
	// 				 WHERE is_active=1 AND is_block=0
	// 				 AND (post_status='${postStatus.NEW}' OR (genie_id=${userId} AND post_status='${postStatus.HOLD}'))`;
	// 		if (watched && watched.length > 0) {
	// 			SQL += ` AND id IN (${watched})`;
	// 		}

	// 		const result1 = await this.sequelize.query(SQL, {
	// 			type: QueryTypes.SELECT,
	// 		});
	// 		resultTotal = result1;
	// 	}

	// 	//select new chats to complite total up to 10 that are similar to genieTopics
	// 	if (leftWatch <= 0) {
	// 		return res.json({
	// 			error: 'You have watched 10 posts  today, please wait for tomorrow',
	// 		});
	// 	}

	// 	let SQL = `SELECT id, post_status, created_at, topic_id, user_header, user_1, user_1_date, user_nickname
	// 				  FROM genie_posts
	// 			  	  WHERE is_active=1 AND is_block=0 AND post_status='${postStatus.NEW}'`;
	// 	if (genieTopics && genieTopics.length > 0) {
	// 		SQL += ` AND topic_id IN (${genieTopics})`;
	// 	}
	// 	if (resultTotal && resultTotal.length > 0) {
	// 		const idsToExclude = resultTotal.map((row) => row.id).join(',');
	// 		SQL += ` AND id NOT IN (${idsToExclude})`;
	// 	}
	// 	SQL += ` LIMIT ${leftWatch}`;

	// 	let result2 = await this.sequelize.query(SQL, {
	// 		type: QueryTypes.SELECT,
	// 	});

	// 	if (result2.length < leftWatch) {
	// 		resultTotal = resultTotal.concat(result2);
	// 		//calculate  how many messsage are left for this genie as leftWatch- result2.length
	// 		const leftWatch2 = leftWatch - result2.length;
	// 		if (leftWatch2 > 0) {
	// 			let SQL = `SELECT id, post_status, created_at, topic_id, user_header, user_1, user_1_date, user_nickname
	// 					FROM genie_posts
	// 					WHERE is_active=1 AND is_block=0 AND post_status='${postStatus.NEW}'`;
	// 			if (resultTotal && resultTotal.length > 0) {
	// 				const idsToExclude = resultTotal.map((row) => row.id).join(',');
	// 				SQL += ` AND id NOT IN (${idsToExclude})`;
	// 			}
	// 			SQL += ` LIMIT ${leftWatch2}`;

	// 			let result3 = await this.sequelize.query(SQL, {
	// 				type: QueryTypes.SELECT,
	// 			});

	// 			resultTotal = resultTotal.concat(result3);
	// 		}
	// 		try {
	// 			const transaction = await this.sequelize.transaction();
	// 			let updatesPerformed = false;
	// 			if (resultTotal && resultTotal.length > 0) {
	// 				let SQL = `update genie_posts set post_status="hold",genie_id=${userId},status_time=UTC_TIMESTAMP() where id in (${resultTotal.map(
	// 					(row) => row.id,
	// 				)})`;

	// 				await this.sequelize.query(SQL, {
	// 					type: QueryTypes.UPDATE,
	// 					transaction,
	// 				});
	// 				const watchingIdsString = resultTotal
	// 					.map((row) => row.id)
	// 					.join(',');
	// 				SQL = `UPDATE genie_users SET genie_watching_ids=?, genie_watching_id_date=UTC_TIMESTAMP() WHERE id=?`;

	// 				await this.sequelize.query(SQL, {
	// 					replacements: [watchingIdsString, userId],
	// 					type: QueryTypes.UPDATE,
	// 					transaction,
	// 				});
	// 			}

	// 			updatesPerformed = true;
	// 			const result = resultTotal.map((row) => {
	// 				return {
	// 					id: row.id,
	// 					post_status: row.post_status,
	// 					created_at: row.created_at,
	// 					topic_id: row.topic_id,
	// 					user_header: row.user_header,
	// 					user_1: row.user_1,
	// 					user_1_date: row.user_1_date,
	// 				};
	// 			});

	// 			if (updatesPerformed) {
	// 				await transaction.commit();
	// 				console.log('resultTotal', resultTotal.length);
	// 				return res.send({
	// 					result,
	// 				});
	// 			} else {
	// 				await transaction.rollback();
	// 				return res.send({
	// 					message: 'No updates were made, transaction rolled back.',
	// 				});
	// 			}
	// 		} catch (e) {
	// 			await transaction.rollback();
	// 			return await res.createErrorLogAndSend({
	// 				err: e,
	// 				message: 'Some error occurred genieGetNewPosts',
	// 			});
	// 		}
	// 	}
	// } catch (e) {
	// 	// await transaction.rollback();
	// 	return await res.createErrorLogAndSend({
	// 		err: e,
	// 		message: 'Some error occurred genieGetNewPosts',
	// 	});
	// }
	// };

	//	 POST api/gb/geniepost
	//notification user email
	genieSendPost = async (req, res) => {
		console.log('at genieSendPost');
		// console.log('genieSendPost', req.body);
		const { message, post_id } = req.body;
		if (!message || !post_id) {
			return res.status(400).json({ error: 'Invalid request' });
		}
		const user = req.user;
		// const today = moment.utc().format('YYYY-MM-DD');
		try {
			const SQL1 = `
				select *
				FROM genie_posts 
				WHERE id = :post_id AND is_active = 1 and  post_status ="open" and is_block=0`;
			const currentPost = await this.sequelize.query(SQL1, {
				replacements: { post_id: post_id },
				type: QueryTypes.SELECT,
			});
			if (currentPost.length === 0) {
				return res.status(400).json({ error: 'No active post found' });
			}
			const post = currentPost[0];
			const turnMatch = post.last_writen_by.split('_');
			if (!turnMatch[1] || turnMatch[0] !== 'user') {
				return res.status(400).json({ error: 'Invalid post state' });
			}
			const nextUserTurn = Number(turnMatch[1]);
			if (nextUserTurn > config.USER_CHATS_PER_POST) {
				return res.status(400).json({ error: 'Maximum post turns exceeded' });
			}

			const nextUserField = 'genie_' + turnMatch[1];
			const nextUserDateField = nextUserField + '_date';
			if (post[nextUserField] && post[nextUserField].trim().length > 0) {
				return res.status(400).json({ error: "It's not the genies's turn" });
			}

			try {
				const SQL3 = `
					UPDATE genie_posts
					SET ${nextUserField} = :message, ${nextUserDateField} = UTC_TIMESTAMP(),last_writen_by = :last_writen_by
					${
						nextUserTurn === config.USER_CHATS_PER_POST
							? `,post_status='closed',status_time=UTC_TIMESTAMP()`
							: ''
					}
					WHERE id = :post_id`;
				console.log('SQL3', SQL3);
				await this.sequelize.query(SQL3, {
					replacements: {
						last_writen_by: nextUserField,
						message: message,
						post_id: post_id,
					},
					type: QueryTypes.UPDATE,
				});

				return res.status(200).json({ message: 'Post updated successfully' });
			} catch (error) {
				console.error('Transaction was rolled back', error);
				return res.status(500).json({
					error: 'Internal Server Error due to transaction failure',
				});
			}
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: 'Internal Server Error' });
		}
	};
}
export default GenieController;
//POST /gb/newCpost
// newPost = async (req, res) => {
// 	console.log('newPost', req.body);
// 	// let resp = {};
// 	try {
// 		let { userId, userTopic, chat } = req.body;
// 		userId = 1;
// 		const SQL = `INSERT INTO genie_posts
//          (post_status, is_active, user_id, topic_id, user_header, user_1, user_1_date)
//          VALUES (:postStatus, :isActive, :userId, :topicId, :userHeader, :userChat, NOW())`;

// 		const result = await this.sequelize.query(SQL, {
// 			replacements: {
// 				postStatus: PostStatus.OPEN,
// 				isActive: 1,
// 				userId: getFixedValue(userId),
// 				topicId: getFixedValue(userTopic),
// 				userHeader: 'test user header',
// 				userChat: getFixedValue(chat),
// 			},
// 			type: QueryTypes.INSERT,
// 		});
// 		console.log('topics result', result);
// 		return res.send('ok');

// 		return res.send({
// 			result,
// 		});
// 	} catch (e) {
// 		return await res.createErrorLogAndSend({
// 			err: e,
// 			message: 'Some error occurred while creating new post',
// 		});
// 	}
// };
// //Get /gb/post
// getPost = async (req, res) => {
// 	console.log('getPost', req.query);
// 	let resp = {};
// 	try {
// 		let postId = req.query.id;
// 		let userId = 1;
// 		if (!postId) {
// 			return res.send('no post id');
// 		}

// 		const SQL = `
// 		SELECT
// 			 gc.postId, gc.post_status, gc.last_writen_by, gc.user_header,
// 			 gc.user_1, gc.user_1_date, gc.genie_1, gc.genie_1_date, gc.user_2,
// 			 gc.user_2_date, gc.genie_2, gc.genie_2_date, gc.user_3, gc.user_3_date,
// 			 gc.genie_3, gc.genie_3_date, gc.user_nickname, gc.genie_nickname,gc.rating,
// 			 gt.topic_name AS topic
// 		FROM commissaire.genie_posts gc
// 		LEFT JOIN commissaire.genie_topics gt ON gc.topic_id = gt.id
// 		WHERE
// 			 gc.id = :postId
// 			 AND gc.genie_id = :userId
// 			 AND gc.blocked != 1
// 			 AND gc.is_active = 1
//   `;

// 		const result = await this.sequelize.query(SQL, {
// 			replacements: {
// 				postId: postId,
// 				userId: userId,
// 			},
// 			type: QueryTypes.SELECT,
// 		});

// 		console.log('topics result', result);
// 		return res.send({
// 			result,
// 		});
// 	} catch (e) {
// 		console.log('getPost error', e);
// 	}
// };
// // GET /gb/genieheaders
// headers = async (req, res) => {
// 	let SQL;
// 	console.log('getGenieChatHeaders', req.query);
// 	try {
// 		const genieId = 1;
// 		const headerType = req.query.headerType;
// 		if (
// 			!headerType ||
// 			headerType === null ||
// 			headerType === undefined ||
// 			headerType === ''
// 		) {
// 			return res.send({
// 				error: 'headerType is required',
// 			});
// 		}
// 		if (headerType === 'new') {
// 			const SQL = `SELECT EXISTS (
// 				SELECT 1 FROM (
// 					 (SELECT COUNT(*)
// 					 FROM genie_posts
// 					 WHERE genie_id = :genieId
// 					 AND post_status = "open"
// 					 AND is_active = 1
// 					 AND blocked = 0
// 					 AND last_writen_by = 'user'
// 					 HAVING COUNT(*) > 3)
// 				UNION ALL
// 					 (SELECT COUNT(*)
// 					 FROM genie_posts
// 					 WHERE genie_id = :genieId
// 					 AND post_status = "open"
// 					 AND is_active = 1
// 					 AND blocked = 0
// 					 HAVING COUNT(*) > 6)
// 				) AS subquery
// 		  ) AS condition_met;`;

// 			const result = await this.sequelize.query(SQL, {
// 				replacements: {
// 					genieId: 1,
// 				},
// 				type: QueryTypes.SELECT,
// 			});

// 			if (result[0].condition_met === 1) {
// 				return res.send({
// 					result: [],
// 					message: 'you have opend posts, please answer them first',
// 				});
// 			}
// 		}

// 		if (headerType === 'new') {
// 			SQL = `select gc.id,gc.user_header,gc.user_nickname,gc.user_1_date,gc.topic_id,gt.topic_name
// 						 from commissaire.genie_posts gc
// 						 join commissaire.genie_topics gt on gc.topic_id=gt.id
// 						 where gc.genie_id is null
// 						 and gc.post_status='new'
// 						 and gc.topic_id in (
// 							  select topic_id from genie_topic_for_genie where genie_id=:genieId
// 						 )
// 						 and gc.blocked!=1
// 						 and gc.is_active=1
// 						 order by gc.user_1_date
// 						 limit 5`;
// 		} else if (headerType === 'open') {
// 			SQL = `select gc.id,gc.user_header,gc.user_nickname,gc.user_1_date,gc.topic_id,gt.topic_name,gc.last_writen_by
// 						 from commissaire.genie_posts gc
// 						 join commissaire.genie_topics gt on gc.topic_id=gt.id
// 						 where gc.genie_id=:genieId
// 						 and gc.post_status='open'
// 						 and gc.blocked!=1
// 						 and gc.is_active=1
// 						 order by gc.user_1_date`;
// 		} else if (headerType === 'closed') {
// 			SQL = `select gc.id,gc.user_header,gc.user_nickname,gc.user_1_date,gc.topic_id,gt.topic_name
// 						 from commissaire.genie_posts gc
// 						 join commissaire.genie_topics gt on gc.topic_id=gt.id
// 						 where gc.genie_id=:genieId
// 						 and gc.post_status='closed'
// 						 and gc.blocked!=1
// 						 and gc.is_active=1
// 						 order by gc.user_1_date`;
// 		}

// 		console.log('SQL', SQL);
// 		const result = await this.sequelize.query(SQL, {
// 			replacements: {
// 				genieId: genieId,
// 			},
// 			type: QueryTypes.SELECT,
// 		});

// 		console.log('topics result', result);
// 		return res.send({
// 			result,
// 		});

// 		return res.send(data);
// 	} catch (e) {
// 		return await res.createErrorLogAndSend({
// 			err: e,
// 			message: 'Some error occurred while getPost',
// 		});
// 	}
// };

// // GET /gb/topics
// topics = async (req, res) => {
// 	console.log('topics', req.query);
// 	let resp = {};
// 	try {
// 		const SQL = `select id,topic_name,active_genies from genie_topics`;
// 		const result = await this.sequelize.query(SQL, {
// 			type: QueryTypes.SELECT,
// 		});
// 		console.log('topics result', result);
// 		return res.send({
// 			result,
// 		});
// 	} catch (e) {
// 		return await res.createErrorLogAndSend({
// 			err: e,
// 			message: 'Some error occurred while getting topics',
// 		});
// 	}
// };

// //PUT /gb/updategenietopic
// updateTopics = async (req, res) => {
// 	// console.log('updategenietopic', req);
// 	let genieId = req.query.genieId; // from aUTH MIDDLEWARE
// 	genieId = 1;
// 	const topic_exists = req.body.topic_exists;
// 	const topic_id = req.body.topic_id;

// 	let resp = {};
// 	try {
// 		let SQL = '';

// 		let replacements = {
// 			genieId: genieId,
// 			topicId: getFixedValue(topic_id),
// 		};

// 		switch (topic_exists) {
// 			case 'true':
// 				SQL = `INSERT INTO genie_topic_for_genie (genie_id, topic_id) VALUES (:genieId, :topicId)`;
// 				break;
// 			case false:
// 				SQL = `DELETE FROM genie_topic_for_genie WHERE genie_id = :genieId AND topic_id = :topicId`;
// 				break;
// 		}

// 		const result = await this.sequelize.query(SQL, {
// 			replacements: replacements,
// 			type: QueryTypes.SELECT,
// 		});

// 		console.log('updategenietopic result', result);
// 		return res.send({
// 			result,
// 		});
// 	} catch (e) {
// 		return await res.createErrorLogAndSend({
// 			err: e,

// 			message: 'Some error occurred while getting topics',
// 		});
// 	}
// };
// //POST /gb/genie
// genieChat = async (req, res) => {
// 	console.log('geniesChat', req.body);
// 	let { userId, postId, genie_fild, text } = req.body;
// 	userId = 1;
// 	if (!userId || !postId || !genie_fild) {
// 		return res.send('no userId or post_id or genie_fild ');
// 	}
// 	if (genie_fild > 3 || genie_fild < 1) {
// 		return res.send('genie_fild Error');
// 	}

// 	if (!text || text.length > 3000) {
// 		return res.send('no text or text too long');
// 	}

// 	let genieId = req.query.genieId; // from aUTH MIDDLEWARE

// 	let resp = {};
// 	try {
// 		let replacements = {
// 			genieFieldText: text,
// 			userId: userId,
// 			postId: postId,
// 		};

// 		let additionalCondition =
// 			genie_fild === '3' ? `,post_status='closed'` : '';

// 		let SQL = `
// 			update genie_posts
// 			set genie_${genie_fild}=:genieFieldText, genie_${genie_fild}_date=now()
// 			${additionalCondition}
// 			where genie_id=:userId and is_active=1 and blocked=0
// 			and ( genie_${genie_fild} is null or genie_${genie_fild}='' )
// 			and postId=:postId
// 	  `;

// 		const result = await this.sequelize.query(SQL, {
// 			replacements: replacements,
// 			type: QueryTypes.UPDATE,
// 		});
// 		console.log('geniesChat result', result);
// 		return res.status(200).send({ status: 'success' });
// 	} catch (e) {
// 		console.log('geniesChat error', e);
// 		return await res.createErrorLogAndSend({
// 			err: e,
// 			message: 'Some error occurred while geniesChat',
// 		});
// 	}
// };
