import BaseController from './baseController';
const { QueryTypes } = require('sequelize');
const { getFixedValue } = require('../utils/getFixedValues');

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
		let resp = {};
		try {
			const SQL = `SELECT id, post_status, created_at, topic_id, user_header, user_1, user_3_date
			genie_1, user_2, genie_2, user_3, genie_3, user_1_date, user_2_date,user_avatar,genie_avatar, 
			user_3_date, genie_1_date, user_2_date, genie_2_date,rating
			FROM genie_posts WHERE user_id = :userId`;

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
				message: 'Some error occurred while userGetPosts',
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
		const { topic_id, header, message, post_id,avatar } = req.body;
		if (!message|| !post_id) {
			return res.status(400).json({ error: 'Invalid request' });
		}
		const user = req.user; // Assuming user is attached to req by previous middleware
		const today = moment.utc().format('YYYY-MM-DD');
		try {
			if (post_id === 'new') {
				const SQL1 = `SELECT user_posts_count_date, user_posts_count
			   FROM genie_users WHERE id = :userId`;
				const userPosts = await this.sequelize.query(SQL1, {
					replacements: { userId: user.id },
					type: QueryTypes.SELECT,
				});

				const userRecord = userPosts[0];
				if (userRecord) {
					const userRecordDate = moment(userRecord.user_posts_count_date).format(
						'YYYY-MM-DD',
					);
					const numOfPosts = parseInt(userRecord.user_posts_count, 10);

					if (
						userRecordDate === today &&
						numOfPosts >= config.USER_POSTS_PER_DAY
					) {
						return res.status(400).json({ error: 'Daily post limit reached' });
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
								  ELSE user_posts_count + 1
							 END
						WHERE id = :userId
							`;
						await this.sequelize.query(SQL2, {
							replacements: {
								userId: user.id,
								today: today,
							},
							type: QueryTypes.UPDATE,
							transaction: transaction,
						});

						const SQL3 = `INSERT INTO genie_posts (is_active, post_status, topic_id, user_header, user_1, created_at, user_id,user_1_date,last_writen_by,is_block,user_avatar) 
					VALUES (1, "new", :topic_id, :header, :user_1, UTC_TIMESTAMP(), :user_id,UTC_TIMESTAMP(),"user_1",0,:avatar)`;
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
						SET ${nextUserField} = :message, ${nextUserDateField} = UTC_TIMESTAMP(),last_writen_by = :last_writen_by
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
}

export default UserController;
