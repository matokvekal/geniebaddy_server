import BaseController from './baseController';
const { QueryTypes } = require('sequelize');
const { getFixedValue } = require('../utils/getFixedValues');
import { postStatus } from '../constants/jenie';
import config from '../config/config.json';
import moment from 'moment';
// import { post } from 'request';

class UserController extends BaseController {
	constructor(app, modelName, sequelize) {
		super(app, modelName, sequelize);
	}

	// GET /gb/userposts
	userGetPosts = async (req, res) => {
		const user = req.user;
		console.log('at userGetPosts');
		try {
			const SQL = `SELECT id, post_status, created_at, topic_id, user_header, user_1,last_writen_by,user_read,
			genie_1, user_2, genie_2, user_3, genie_3, user_1_date,user_avatar,genie_avatar,user_nickname,genie_nickname,
			user_3_date, genie_1_date, user_2_date, genie_2_date,genie_3_date,rating,user_save
			FROM genie_posts WHERE user_id = :userId and is_active=1 and user_delete !=1 and( post_status= '${postStatus.OPEN}' or post_status='${postStatus.CLOSED}'
			or post_status='${postStatus.NEW}' or post_status='${postStatus.USER_CHECK}' or post_status='${postStatus.GENIE_CHECK}')`;
			// console.log('userGetPosts', SQL);
			const result = await this.sequelize.query(SQL, {
				replacements: { userId: user.id },
				type: QueryTypes.SELECT,
			});

			// const SQLUPDATE = `update genie_posts set user_read=1 where user_id=${user.id} and user_read=0 and is_active=1`;
			// await this.sequelize.query(SQLUPDATE, {
			// 	type: QueryTypes.UPDATE,
			// });
			// console.log('userGetPosts result', result);
			return res.send({
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while userGetPosts',
			});
		}
	};
	// PUT /gb/userreadposts
	userReadPosts = async (req, res) => {
		const user = req.user;
		const post_id = req.query.postid;
		console.log('at userReadPosts');
		try {
			// const SQL = `SELECT *
			// FROM genie_posts WHERE user_id = :userId and is_active=1 and user_delete !=1 and( post_status= '${postStatus.OPEN}')`;
			// // console.log('userGetPosts', SQL);
			// const result = await this.sequelize.query(SQL, {
			// 	replacements: { userId: user.id },
			// 	type: QueryTypes.SELECT,
			// });
			// if(result && result[0].user_read===0){
			const SQL = `update genie_posts set user_read=1 where id = :post_id and user_id=${user.id} and user_read=0 and is_active=1`;
			console.log('r ', SQL);
			const result = await this.sequelize.query(SQL, {
				replacements: { post_id: post_id },
				type: QueryTypes.UPDATE,
			});

			// }
			return res.send({
				'user_read': post_id,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while userGetPosts',
			});
		}
	};

	// GET /gb/getpostbyid
	userGetPostById = async (req, res) => {
		const user = req.user;
		const post_id = req.query.postId;
		console.log('at userGetPosts');
		try {
			const SQL = `SELECT id, post_status, created_at, topic_id, user_header, user_1,last_writen_by,user_read,
			genie_1, user_2, genie_2, user_3, genie_3, user_1_date,user_avatar,genie_avatar,user_nickname,genie_nickname,
			user_3_date, genie_1_date, user_2_date, genie_2_date,genie_3_date,rating,user_save
			FROM genie_posts WHERE id = :post_id and user_id = :userId and is_active=1 and user_delete !=1 and( post_status= '${postStatus.OPEN}' or post_status='${postStatus.CLOSED}'
			or post_status='${postStatus.NEW}' or post_status='${postStatus.USER_CHECK}' or post_status='${postStatus.GENIE_CHECK}')`;
			// console.log('userGetPosts', SQL);
			const result = await this.sequelize.query(SQL, {
				replacements: { userId: user.id, post_id: post_id },
				type: QueryTypes.SELECT,
			});

			// const SQLUPDATE = `update genie_posts set user_read=1 where user_id=${user.id} and user_read=0 and is_active=1 and user_id = ${user.id}`;
			// await this.sequelize.query(SQLUPDATE, {
			// 	type: QueryTypes.UPDATE,
			// });
			console.log('userGetPostById result');
			return res.send({
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while userGetPostById',
			});
		}
	};

	// GET /gb/usernewchats
	userGetNewChats = async (req, res) => {
		const user = req.user;
		console.log('at userGetNewChats');
		try {
			const SQL = `SELECT id, post_status, created_at, topic_id, user_header, user_1, user_3_date,last_writen_by,user_read,
			genie_1, user_2, genie_2, user_3, genie_3, user_1_date, user_2_date,user_avatar,genie_avatar, 
			user_3_date, genie_1_date, user_2_date, genie_2_date,rating 
			FROM genie_posts WHERE user_id = :userId and user_read=0  and is_active=1 and user_delete !=1 
			and (post_status='${postStatus.OPEN}' or post_status='${postStatus.NEW}' or post_status='${postStatus.CLOSED}')`;

			// console.log('userGetNewChats', SQL);
			const result = await this.sequelize.query(SQL, {
				replacements: { userId: user.id },
				type: QueryTypes.SELECT,
			});

			// const SQLUPDATE = `update genie_posts set user_read=1 where user_id=${user.id}  and is_active=1 and user_read=0 and (post_status='${postStatus.OPEN}' or post_status='${postStatus.CLOSED}')`;
			// await this.sequelize.query(SQLUPDATE, {
			// 	type: QueryTypes.UPDATE,
			// });

			return res.send({
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while userGetNewChats',
			});
		}
	};

	// GET /gb/getuserlimits
	userLimits = async (req, res) => {
		console.log('get userLimits');
		const user = req.user;
		const result = {
			USER_CHATS_PER_POST: config.USER_CHATS_PER_POST,
			USER_POSTS_PER_DAY: config.USER_POSTS_PER_DAY,
		};
		try {
			const SQL = `select user_posts_count, user_posts_count_date from genie_users
			 WHERE id = :userId order by user_posts_count_date desc;`;
			const userLimits = await this.sequelize.query(SQL, {
				replacements: {
					userId: user.id,
				},
				type: QueryTypes.SELECT,
			});
			if (!userLimits || !userLimits[0]) {
				return res.status(404).json({ error: 'User record not found' });
			}
			result.USER_POSTS_COUNT = userLimits[0].user_posts_count;
			result.USER_POSTS_DATE = userLimits[0].user_posts_count_date;
			const currentDate = moment.utc().startOf('day');
			const user_posts_count_date = moment
				.utc(result.USER_POSTS_COUNT_DATE)
				.startOf('day');
			if (user_posts_count_date.isBefore(currentDate)) {
				result.USER_POSTS_LEFT = config.USER_POSTS_PER_DAY;
			} else if (user_posts_count_date.isSame(currentDate)) {
				result.USER_POSTS_LEFT =
					config.USER_POSTS_PER_DAY - result.USER_POSTS_COUNT;
			} else {
				result.USER_POSTS_LEFT = config.USER_POSTS_PER_DAY;
			}
			console.log('userLimits result', result);
			return res.send({
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while getting userLimits',
			});
		}
	};

	//	 POST api/gb/userpost
	userSendPost = async (req, res) => {
		console.log('get userSendPost');
		// console.log('userpost', req.body);
		let { topic_id, header, message, post_id, avatar } = req.body;

		if (!message || !post_id) {
			return res.status(400).json({ error: 'Invalid request' });
		}
		const user = req.user; // Assuming user is attached to req by previous middleware
		const today = moment.utc().format('YYYY-MM-DD');
		try {
			if (post_id === 'new') {
				if (!topic_id) {
					topic_id = config.DEFAULT_TOPIC_ID; // default topic
				}
				const SQL1 = `SELECT user_posts_count_date, user_posts_count
			   FROM genie_users WHERE id = :userId`;
				const userPosts = await this.sequelize.query(SQL1, {
					replacements: { userId: user.id },
					type: QueryTypes.SELECT,
				});

				const userRecord = userPosts[0];
				if (userRecord) {
					if (
						userRecord.user_posts_count_date != null &&
						userRecord.user_posts_count != null
					) {
						const userRecordDate = moment(
							userRecord.user_posts_count_date,
						).format('YYYY-MM-DD');
						const numOfPosts = parseInt(userRecord.user_posts_count, 10);

						if (
							userRecordDate === today &&
							numOfPosts >= config.USER_POSTS_PER_DAY
						) {
							return res
								.status(400)
								.json({ error: 'Daily post limit reached' });
						}
					}
					const transaction = await this.sequelize.transaction();
					try {
						const SQL2 = `
						UPDATE genie_users
						SET 
							 user_posts_count_date = :today,
							 user_posts_count = 
							 CASE
								  WHEN user_posts_count_date != :today THEN 1
								  ELSE COALESCE(user_posts_count, 0) + 1
							 END
						WHERE id = :userId;
						
							`;
						await this.sequelize.query(SQL2, {
							replacements: {
								userId: user.id,
								today: today,
							},
							type: QueryTypes.UPDATE,
							transaction: transaction,
						});
						const SQLTOPIC = `select topic_name from genie_topics where id=:topic_id  and is_active=1`;
						const user_header = await this.sequelize.query(SQLTOPIC, {
							replacements: {
								topic_id: topic_id,
							},
							type: QueryTypes.SELECT,
							transaction: transaction,
						});
						let headerData = '';
						if (user_header && user_header[0]) {
							headerData = user_header[0].topic_name;
						} else {
							headerData = topic_id;
						}
						//update table topisc set used=used+1 where id=topic_id
						const SQLTOPICUPDATE = `update genie_topics set used=used+1 where id=:topic_id  and is_active=1`;
						await this.sequelize.query(SQLTOPICUPDATE, {
							replacements: {
								topic_id: topic_id,
							},
							type: QueryTypes.UPDATE,
							transaction: transaction,
						});

						const SQL3 = `INSERT INTO genie_posts (is_active, post_status,status_time, topic_id, user_header, user_1, created_at, user_id,user_1_date,last_writen_by,user_avatar,user_read) 
					   VALUES (1, '${postStatus.NEW}', UTC_TIMESTAMP(), :topic_id, '${headerData}', :user_1, UTC_TIMESTAMP(), :user_id,UTC_TIMESTAMP(),"user_1",:avatar,1)`;
						const newPost = await this.sequelize.query(SQL3, {
							replacements: {
								topic_id,
								header,
								user_1: message,
								user_id: user.id,
								avatar: avatar,
							},
							type: QueryTypes.INSERT,
							transaction: transaction,
						});
						await transaction.commit();
						// Sending to AI middleware (assuming function is implemented elsewhere)
						// checkAbuseAndAnonymize({ topic_id, header, message });
						return res.status(200).json({
							message: 'Post saved successfully',
							postId: newPost[0],
						});
					} catch (error) {
						await transaction.rollback();
						console.error('Transaction was rolled back', error);
						return res.status(500).json({
							error: 'Internal Server Error due to transaction failure',
						});
					}
				} else {
					return res.status(404).json({ error: 'User record not found' });
				}
			} else {
				//continue post
				try {
					const SQL1 = `
					select *
					FROM genie_posts 
					WHERE id = :post_id AND is_active = 1 and user_delete !=1 and  post_status ='${postStatus.OPEN}'`;
					const currentPost = await this.sequelize.query(SQL1, {
						replacements: { post_id: post_id },
						type: QueryTypes.SELECT,
					});
					if (currentPost.length === 0) {
						return res.status(400).json({ error: 'No active post found' });
					}
					const post = currentPost[0];
					const turnMatch = post.last_writen_by.split('_');
					if (!turnMatch[1] || turnMatch[0] !== 'genie') {
						return res.status(400).json({ error: 'Invalid post state' });
					}

					const nextUserTurn = Number(turnMatch[1]) + 1;
					if (nextUserTurn > config.USER_CHATS_PER_POST) {
						return res
							.status(400)
							.json({ error: 'Maximum post turns exceeded' });
					}

					// Concatenate strings directly for field names.
					const nextUserField = 'user_' + nextUserTurn;
					const nextUserDateField = nextUserField + '_date';
					if (post[nextUserField] && post[nextUserField].trim().length > 0) {
						return res.status(400).json({ error: "It's not the user's turn" });
					}
					// const transaction = await this.sequelize.transaction();
					try {
						const SQL3 = `
						UPDATE genie_posts
						SET ${nextUserField} = :message, ${nextUserDateField} = UTC_TIMESTAMP(),last_writen_by = :last_writen_by, user_read=1,genie_read=0 
						WHERE id = :post_id and post_status='${postStatus.OPEN}' and is_active=1 and user_delete !=1`;
						// console.log('SQL3', SQL3);
						await this.sequelize.query(SQL3, {
							replacements: {
								last_writen_by: nextUserField,
								message: message,
								post_id: post_id,
							},
							type: QueryTypes.UPDATE,
						});

						return res
							.status(200)
							.json({ message: 'Post updated successfully' });
					} catch (error) {
						// await transaction.rollback();
						console.error('Transaction was rolled back', error);
						return res.status(500).json({
							error: 'Internal Server Error due to transaction failure',
						});
					}
				} catch (error) {
					console.error(error);
					return res.status(500).json({ error: 'Internal Server Error' });
				}
			}
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: 'Internal Server Error' });
		}
	};
	// POST /gb/useraction
	updateUserAction = async (req, res) => {
		console.log('get updateUserAction ');
		const { action, post_id, comment } = req.body;
		const user = req.user; // Assuming user is attached to req by previous middleware
		const today = moment.utc().format('YYYY-MM-DD');

		if (!action || !post_id) {
			return res.status(400).json({ error: 'Invalid request' });
		}
		try {
			let SQL = '';
			switch (action) {
				case 'rubi':
					SQL = `
								UPDATE genie_posts
								SET rating = CASE 
									 WHEN rating IS NULL THEN 1 
									 ELSE LEAST(rating + 1, 5) 
								END
								, action_comment=:comment ,action_date="${today}"
								WHERE id = :post_id AND is_active = 1`;
					break;
				case 'save':
					SQL = `UPDATE genie_posts SET user_save = 1, action_comment=:comment WHERE id = :post_id AND is_active = 1 and user_save !=1`;
					break;
				case 'closed':
					SQL = `
								UPDATE genie_posts
								SET post_status = '${postStatus.CLOSED}', status_time = UTC_TIMESTAMP(), action_comment=:comment,action_date="${today}"
								WHERE id = :post_id AND is_active = 1 AND post_status != '${postStatus.CLOSED}'`;
					break;
				case 'delete_for_me':
					SQL = `UPDATE genie_posts SET user_delete = 1,post_status = '${postStatus.CLOSED}', action_comment=:comment,action_date="${today}" WHERE id = :post_id AND is_active = 1`;
					break;
				case 'delete_for_all':
					SQL = `
								UPDATE genie_posts
								SET user_delete = 1,post_status = '${postStatus.CLOSED}', action_comment=:comment,action_date="${today}",
								is_active = CASE 
									 WHEN post_status = 'new' THEN 0
									 ELSE 1
								END
								WHERE id = :post_id AND is_active = 1`;
					break;
				case 'report_chat':
					SQL = `
								UPDATE genie_posts
								SET user_report = 1,  post_status = '${postStatus.CLOSED}', is_active = 0, action_comment=:comment,action_date="${today}"
								WHERE id = :post_id AND is_active = 1 AND post_status != '${postStatus.CLOSED}'`;
					break;
				default:
					return res.status(400).json({ error: 'Invalid action' });
			}
			// console.log('SQL updateUserAction', SQL);
			await this.sequelize.query(SQL, {
				replacements: { post_id: post_id, comment: comment },
				type: QueryTypes.UPDATE,
			});

			// if (result[0].affectedRows === 0) {
			// 	return res.status(400).json({
			// 		message: 'No updates were made. Check if conditions were met.',
			// 	});
			// }

			return res.status(200).json({ message: 'Your action sent to server' });
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: 'Internal Server Error' });
		}
	};
}

export default UserController;
