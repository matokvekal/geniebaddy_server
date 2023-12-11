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

		try {
			const SQL = `SELECT p.id, post_status, created_at, topic_id,topic_name, user_header, user_1,last_writen_by,user_read,genie_read,
			genie_1, user_2, genie_2, user_3, genie_3, user_1_date,user_avatar,genie_avatar,user_nickname,genie_nickname,
			user_3_date, genie_1_date, user_2_date, genie_2_date,genie_3_date,rating,user_save
			FROM genie_posts as p
					 join genie_topics as t
					 on t.id=p.topic_id 
				WHERE genie_id = ${userId} and p.is_active=1 AND t.is_active = 1 AND user_delete !=1 and( post_status= '${postStatus.OPEN}' or post_status='${postStatus.CLOSED}'
				 or post_status='${postStatus.USER_AI}' or post_status='${postStatus.GENIE_AI}')`;

			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			return res.send({
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while genieGetPosts',
			});
		}
	};

	// GET /gb/genienewchats

	genieGetNewChats = async (req, res) => {
		console.log('at genieGetNewChats');
		const user = req.user;
		const userId = user.id;
		if (!userId) {
			return res.status(400).json({ error: 'No user id' });
		}
		try {
			const SQL = `SELECT p.id,
			   post_status,
				user_nickname,
				genie_nickname,
			   created_at,
			   topic_id,
				topic_name,
				user_header,
				user_1,
				user_3_date,
				genie_1, 
				user_2, 
				genie_2, 
				user_3, 
				genie_3, 
				user_1_date, 
				user_2_date, 
				user_3_date, 
				genie_1_date, 
				user_2_date, 
				genie_2_date,
				rating,
				user_avatar,
				genie_avatar,
				genie_read,
				user_read,
				last_writen_by
				FROM genie_posts as p
				join genie_topics as t
            on t.id=p.topic_id
				WHERE
				genie_id = ${userId} and 
				post_status='${postStatus.OPEN}'`;

			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});

			return res.send({
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while genieGetNewChats',
			});
		}
	};
	// POST /gb/genieclamePost
	genieClamePost = async (req, res) => {
		console.log('at genieClamePost');
		const user = req.user;
		const userId = user.id;

		const { postId, avatar, genieNickname } = req.body;
		console.log(' post id =', postId);
		if (!userId || !postId) {
			return res.status(400).json({ error: 'No post  id' });
		}

		try {
			let SQL = `SELECT * FROM genie_posts 
           WHERE id = ${postId} and is_active=1  and post_status='${postStatus.HOLD}'and genie_id=${userId}`;
			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			if (!result || result.length === 0) {
				{
					return res.status(400).json({ error: 'Post already selected' });
				}
			}
			//update to open selected post
			SQL = `update genie_posts set post_status='${postStatus.OPEN}',genie_id=${userId},status_time=UTC_TIMESTAMP(),user_read=0,genie_read=0,genie_avatar=:genie_avatar,genie_nickname=:genieNickname  where id=:postId and post_status='${postStatus.HOLD}'`;
			// console.log('SQL1	', SQL);
			await this.sequelize.query(SQL, {
				replacements: {
					postId: postId,
					genie_avatar: avatar ? avatar : 0,
					genieNickname: genieNickname,
				},
				type: QueryTypes.UPDATE,
			});

			//update to new all other post of this genie(free other posts)
			SQL = `update genie_posts set post_status='${postStatus.NEW}',genie_id=0,user_read=0,status_time=UTC_TIMESTAMP() where genie_id=${userId} and post_status='${postStatus.HOLD}'`;
			// console.log('SQL2	', SQL);
			await this.sequelize.query(SQL, {
				type: QueryTypes.UPDATE,
			});

			SQL = `UPDATE genie_users SET genie_answer_count=genie_answer_count+1,last_active=UTC_TIMESTAMP(), genie_answer_count_date=UTC_TIMESTAMP() WHERE id=?`;
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
				message: 'Some error occurred while genieClamePost',
			});
		}
	};
	// GET /gb/genierefreshposts
	genieRefreshPosts = async (req, res) => {
		const user = req.user;
		console.log('at genieRefreshPosts');
		try {
			const SQL = `SELECT p.id, post_status, created_at, topic_id,topic_name, user_header, user_1,last_writen_by,user_read,
			genie_1, user_2, genie_2, user_3, genie_3, user_1_date,user_avatar,genie_avatar,user_nickname,genie_nickname,
			user_3_date, genie_1_date, user_2_date, genie_2_date,genie_3_date,rating,user_save
			FROM genie_posts as p
                join genie_topics as t
                on t.id=p.topic_id 
			WHERE genie_id = :userId and p.is_active=1 AND t.is_active = 1 AND user_delete !=1 and
			(( post_status= '${postStatus.CLOSED}' && user_read=0) 
			||( post_status= '${postStatus.OPEN}' 
			or post_status='${postStatus.NEW}' or post_status='${postStatus.USER_AI}' or post_status='${postStatus.GENIE_AI}' or post_status='${postStatus.HOLD}'))`;
			const result = await this.sequelize.query(SQL, {
				replacements: { userId: user.id },
				type: QueryTypes.SELECT,
			});

			return res.send({
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while genieRefreshPosts',
			});
		}
	};
	// GET /gb/genienewposts //for claim
	genieGetNewPosts = async (req, res) => {
		console.log('at genieGetNewPosts');
		let transaction;
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
				CON.MAX_GENIE_WATCH -
				(watched && watched.trim().length > 0 ? watched.split(',').length : 0);

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
			transaction = await this.sequelize.transaction();
			try {
				//if genie watch today>0 select (if its new ) to res 1
				//if watch today<10 so select  new with same topit limit   10-watch today they new and  ginie=0but the id not in watch1
				//after select do the update

				//select chats the genie allredy watch tody and the or new or in hold
				if (leftWatch < CON.MAX_GENIE_WATCH) {
					let SQL = `SELECT 
					p.id,
					p.user_avatar, 
					post_status, 
					created_at, 
					topic_id,
					topic_name, 
					user_header, 
					user_1, 
					user_1_date, 
					user_nickname,
					genie_nickname,
					last_writen_by 
				FROM genie_posts as p
				join genie_topics as t
            on t.id=p.topic_id
				WHERE p.is_active=1 AND t.is_active = 1 AND 
				 p.id IN (${watched})AND 
				(post_status='${postStatus.NEW}' OR (genie_id=${userId} AND post_status='${postStatus.HOLD}'))`;
					const result1 = await this.sequelize.query(SQL, {
						type: QueryTypes.SELECT,
					});
					if (result1 && result1.length > 0) {
						resultTotal = result1;
					}
				}
				//select new chats to complite total up to 10 that are similar to genieTopics
				if (leftWatch > 0) {
					let SQL = `SELECT 
					p.id, 
					p.user_avatar,
					post_status, 
					created_at, 
					topic_id,
					topic_name, 
					user_header, 
					user_1, 
					user_1_date, 
					user_nickname,
					genie_nickname,
					last_writen_by 
			   	FROM genie_posts as p
				   join genie_topics as t
               on t.id=p.topic_id
					WHERE	 p.is_active=1 AND
					   post_status='${postStatus.NEW}'`;
					if (genieTopics && genieTopics.length > 0) {
						SQL += ` AND topic_id IN (${genieTopics})`;
					}
					if (resultTotal && resultTotal.length > 0) {
						const allredyWatch = resultTotal.map((row) => row.id).join(',');
						SQL += ` AND p.id NOT IN (${allredyWatch})`;
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
						SQL = `UPDATE genie_users SET genie_watching_ids=?,last_active=UTC_TIMESTAMP(), genie_watching_id_date=UTC_TIMESTAMP() WHERE id=?`;
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
							user_avatar: row.user_avatar,
							post_status: row.post_status,
							created_at: row.created_at,
							topic_id: row.topic_id,
							user_header: row.user_header,
							user_1: row.user_1,
							topic_name: row.topic_name,
							user_nickname: row.user_nickname,
							topic_name: row.topic_name,
						};
					});
					// console.log('result', result.length);
					return res.send({ result });
				} else {
					return res.send({
						message: 'No new messages today, please wait for tomorrow',
					});
				}
			} catch (e) {
				// Rollback the transaction in case of an error
				if (transaction) await transaction.rollback();
				// await transaction.rollback();
				return res.createErrorLogAndSend({
					err: e,
					message: 'Some error occurred genieGetNewPosts',
				});
			}
		} catch (e) {
			if (transaction) await transaction.rollback();
			// await transaction.rollback();
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred genieGetNewPosts',
			});
		}
	};

	//	 POST api/gb/geniepost
	genieSendPost = async (req, res) => {
		console.log('at genieSendPost');
		// console.log('genieSendPost', req.body);
		const { message, post_id } = req.body;
		if (!message || !post_id) {
			return res.status(400).json({ error: 'Invalid request' });
		}
		try {
			const SQL1 = `select * FROM genie_posts WHERE id = :post_id AND is_active = 1 and  post_status ="open"`;
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
					SET ${nextUserField} = :message, ${nextUserDateField} = UTC_TIMESTAMP(),genie_read=1,user_read=0,
					last_writen_by = :last_writen_by
					${
						nextUserTurn === config.USER_CHATS_PER_POST
							? `,post_status='closed',status_time=UTC_TIMESTAMP()`
							: ''
					}
					WHERE id = :post_id`;
				// console.log('SQL3', SQL3);
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
				console.error('Error at genieSendPost', error);
				return res.status(500).json({
					error: 'Internal Server Error due to transaction failure',
				});
			}
		} catch (error) {
			console.error(error);
			return res
				.status(500)
				.json({ error: 'Internal Server Error genieSendPost' });
		}
	};

	// GET /gb/geniegetpostbyid
	genieGetPostBiid = async (req, res) => {
		const user = req.user;
		const post_id = req.query.postId;
		console.log('at genieGetPostBiid');
		try {
			const SQL = `SELECT p.id, post_status, created_at, topic_id, user_header, user_1,last_writen_by,user_read,
			genie_1, user_2, genie_2, user_3, genie_3, user_1_date,user_avatar,genie_avatar,user_nickname,genie_nickname,	genie_read,
			user_read,			
user_3_date, genie_1_date, user_2_date, genie_2_date,genie_3_date,rating,user_save
			FROM genie_posts as p
                join genie_topics as t
                on t.id=p.topic_id
			WHERE id = :post_id and genie_id = :userId and p.is_active=1 AND t.is_active = 1 AND user_delete !=1 and( post_status= '${postStatus.OPEN}' or post_status='${postStatus.CLOSED}'
			or post_status='${postStatus.NEW}' or post_status='${postStatus.USER_AI}' or post_status='${postStatus.GENIE_AI}')`;
			// console.log('userGetPosts', SQL);
			const result = await this.sequelize.query(SQL, {
				replacements: { userId: user.id, post_id: post_id },
				type: QueryTypes.SELECT,
			});

			console.log('genieGetPostBiid result');
			return res.send({
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while genieGetPostBiid',
			});
		}
	};
	// GET /gb/geniereadposts
	genieReadPosts = async (req, res) => {
		const user = req.user;
		const post_id = req.query.postid;
		console.log('at geniereadposts');
		try {
			const SQL = `update genie_posts set genie_read=1 where id = :post_id and genie_id=${user.id} and genie_read=0 and is_active=1`;
			console.log('r ', SQL);
			const result = await this.sequelize.query(SQL, {
				replacements: { post_id: post_id },
				type: QueryTypes.UPDATE,
			});

			// }
			return res.send({
				post_id: post_id,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while geniereadposts',
			});
		}
	};
}
export default GenieController;
