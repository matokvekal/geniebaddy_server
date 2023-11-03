import BaseController from './baseController';
const { QueryTypes } = require('sequelize');
const { getFixedValue } = require('../utils/getFixedValues');
import { PostStatus } from '../constants/jenie';
// const data = [
// 	{
// 		postId: 111111,
// 		image: 'avatar1.png',
// 		topic: 'depression',
// 		date: '3 days ago',
// 		status: 'open',
// 		star: true,
// 		header: 'Job loss left me feeling worthless',
// 	},
// 	{
// 		postId: 111117,
// 		image: 'avatar2.png',
// 		topic: 'devorce',
// 		date: '1 hour ago',
// 		status: 'closed',
// 		star: false,
// 		header: 'Devorce has left me feeling broken',
// 	},
// 	{
// 		postId: 111112,
// 		image: 'avatar3.png',
// 		topic: 'anxiety',
// 		date: '2 days ago',
// 		status: 'open',
// 		star: true,
// 		header: 'Constant worry keeps me up nights',
// 	},
// 	{
// 		postId: 111122,
// 		image: 'avatar3.png',
// 		topic: 'anxiety',
// 		date: '2 days ago',
// 		status: 'open',
// 		star: true,
// 		header: 'Anxiety stops me from living fully',
// 	},
// 	{
// 		postId: 111119,
// 		image: 'avatar3.png',
// 		topic: 'anxiety',
// 		date: '2 days ago',
// 		status: 'open',
// 		star: true,
// 		header: 'Feeling anxious about every life decision',
// 	},
// 	{
// 		postId: 111123,
// 		image: 'avatar3.png',
// 		topic: 'anxiety',
// 		date: '2 days ago',
// 		status: 'open',
// 		star: true,
// 		header: 'Anxiety is overshadowing my daily life',
// 	},
// 	{
// 		postId: 111124,
// 		image: 'avatar3.png',
// 		topic: 'anxiety',
// 		date: '2 days ago',
// 		status: 'open',
// 		star: true,
// 		header: 'Constant fear is crippling my life',
// 	},
// 	{
// 		postId: 111125,
// 		image: 'avatar3.png',
// 		topic: 'anxiety',
// 		date: '2 days ago',
// 		status: 'open',
// 		star: true,
// 		header: 'Living with anxiety is very difficult',
// 	},
// ];
class GenieController extends BaseController {
	constructor(app, modelName, sequelize) {
		super(app, modelName, sequelize);
	}

	//converstaion_status:new,genie_1,user_2,genie_2,user_3,closed
	//POST /gb/newCpost
	newPost = async (req, res) => {
		console.log('newPost', req.body);
		// let resp = {};
		try {
			let { userId, userTopic, chat } = req.body;
			userId = 1;
			//TODO
			//ceck how many post user done from midnight,
			// check user is not blocked
			//increase counter of selected topic
			//incrise counter user post today

			//here we use AI:
			//1.check for not ubused genie >> block post, warn user
			//2.check for no private details such names id phones adreses,  block post, warn user
			//3.check for commit suicide intent>> move to special/professionals
			//4.if not selected topic, find the right topic
			//5.get short explain for topic

			// let SQL = `INSERT INTO genie_posts
			//  (post_status,is_active,user_id,topic_id,user_header,user_1,user_1_date)
			// VALUES ('new',1,${getFixedValue(userId)},${getFixedValue(
			// 	userTopic,
			// )},"test",${getFixedValue(chat)},now())`;
			// let result = await this.sequelize.query(SQL, {
			// 	type: QueryTypes.INSERT,
			// });
			const SQL = `INSERT INTO genie_posts
            (post_status, is_active, user_id, topic_id, user_header, user_1, user_1_date) 
            VALUES (:postStatus, :isActive, :userId, :topicId, :userHeader, :userChat, NOW())`;

			const result = await this.sequelize.query(SQL, {
				replacements: {
					postStatus: PostStatus.OPEN,
					isActive: 1,
					userId: getFixedValue(userId),
					topicId: getFixedValue(userTopic),
					userHeader: 'test user header',
					userChat: getFixedValue(chat),
				},
				type: QueryTypes.INSERT,
			});

			// const lastInsertId = result[0]; // Assuming the ID column is the primary key

			// console.log('Last Inserted ID:', lastInsertId);
			//  SQL = `select id,topic_explain,user_1,user_1_date from genie_posts whar id=${lastInsertId}`;
			//  result = await this.sequelize.query(SQL, {
			// 	type: QueryTypes.SELECT,
			// });
			console.log('topics result', result);
			return res.send('ok');

			//get the conversetion id
			//select the post and send to the user save at state
			return res.send({
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while creating new post',
			});
		}
	};
	//Get /gb/post
	getPost = async (req, res) => {
		console.log('getPost', req.query);
		let resp = {};
		try {
			let postId = req.query.id;
			let userId = 1;
			if (!postId) {
				return res.send('no post id');
			}

			// const SQL = `select  postId,post_status,last_writen_by,user_header,user_1,user_1_date,genie_1,genie_1_date,user_2,user_2_date,genie_2,
			// genie_2_date,user_3,user_3_date,genie_3,genie_3_date,user_nickname,genie_nickname
			// ,(select topic_name from genie_topics where id= (select topic_id from  genie_posts where id= ${postId})) topic
			// from commissaire.genie_posts gc
			// where gc.id=${postId}
			// and  gc.genie_id =${userId}
			// and gc.is_block!=1
			// and gc.is_active=1`;
			// const result = await this.sequelize.query(SQL, {
			// 	type: QueryTypes.SELECT,
			// });
			const SQL = `
			SELECT 
				 gc.postId, gc.post_status, gc.last_writen_by, gc.user_header, 
				 gc.user_1, gc.user_1_date, gc.genie_1, gc.genie_1_date, gc.user_2, 
				 gc.user_2_date, gc.genie_2, gc.genie_2_date, gc.user_3, gc.user_3_date, 
				 gc.genie_3, gc.genie_3_date, gc.user_nickname, gc.genie_nickname,gc.rating,
				 gt.topic_name AS topic
			FROM commissaire.genie_posts gc
			LEFT JOIN commissaire.genie_topics gt ON gc.topic_id = gt.id
			WHERE 
				 gc.id = :postId 
				 AND gc.genie_id = :userId 
				 AND gc.is_block != 1
				 AND gc.is_active = 1
	  `;

			const result = await this.sequelize.query(SQL, {
				replacements: {
					postId: postId,
					userId: userId,
				},
				type: QueryTypes.SELECT,
			});

			console.log('topics result', result);
			return res.send({
				result,
			});
		} catch (e) {
			console.log('getPost error', e);
		}
	};
	// GET /gb/genieheaders
	headers = async (req, res) => {
		let SQL;
		console.log('getGenieChatHeaders', req.query);
		try {
			const genieId = 1;
			const headerType = req.query.headerType;
			if (
				!headerType ||
				headerType === null ||
				headerType === undefined ||
				headerType === ''
			) {
				return res.send({
					error: 'headerType is required',
				});
			}
			//if genie ask new then we
			//need to check that genie not have more than 2 new posts and no more than 2 open posts that he need to  answer
			// and not more then total 5 posts at open stage
			// if found then return "you have opend posts, please answer them first"
			if (headerType === 'new') {
				const SQL = `SELECT EXISTS (
					SELECT 1 FROM (
						 (SELECT COUNT(*) 
						 FROM genie_posts
						 WHERE genie_id = :genieId
						 AND post_status = "open"
						 AND is_active = 1
						 AND is_block = 0
						 AND last_writen_by = 'user'
						 HAVING COUNT(*) > 3)
					UNION ALL
						 (SELECT COUNT(*) 
						 FROM genie_posts
						 WHERE genie_id = :genieId
						 AND post_status = "open"
						 AND is_active = 1
						 AND is_block = 0
						 HAVING COUNT(*) > 6)
					) AS subquery
			  ) AS condition_met;`;

				const result = await this.sequelize.query(SQL, {
					replacements: {
						genieId: 1,
					},
					type: QueryTypes.SELECT,
				});

				if (result[0].condition_met === 1) {
					return res.send({
						result: [],
						message: 'you have opend posts, please answer them first',
					});
				}
			}

			if (headerType === 'new') {
				SQL = `select gc.id,gc.user_header,gc.user_nickname,gc.user_1_date,gc.topic_id,gt.topic_name 
							 from commissaire.genie_posts gc
							 join commissaire.genie_topics gt on gc.topic_id=gt.id
							 where gc.genie_id is null 
							 and gc.post_status='new'
							 and gc.topic_id in (
								  select topic_id from genie_topic_for_genie where genie_id=:genieId
							 )
							 and gc.is_block!=1
							 and gc.is_active=1
							 order by gc.user_1_date 
							 limit 5`;
			} else if (headerType === 'open') {
				SQL = `select gc.id,gc.user_header,gc.user_nickname,gc.user_1_date,gc.topic_id,gt.topic_name,gc.last_writen_by 
							 from commissaire.genie_posts gc
							 join commissaire.genie_topics gt on gc.topic_id=gt.id
							 where gc.genie_id=:genieId 
							 and gc.post_status='open'
							 and gc.is_block!=1
							 and gc.is_active=1
							 order by gc.user_1_date`;
			} else if (headerType === 'closed') {
				SQL = `select gc.id,gc.user_header,gc.user_nickname,gc.user_1_date,gc.topic_id,gt.topic_name 
							 from commissaire.genie_posts gc
							 join commissaire.genie_topics gt on gc.topic_id=gt.id
							 where gc.genie_id=:genieId 
							 and gc.post_status='closed'
							 and gc.is_block!=1
							 and gc.is_active=1
							 order by gc.user_1_date`;
			}

			console.log('SQL', SQL);
			const result = await this.sequelize.query(SQL, {
				replacements: {
					genieId: genieId,
				},
				type: QueryTypes.SELECT,
			});

			console.log('topics result', result);
			return res.send({
				result,
			});

			return res.send(data);
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while getPost',
			});
		}
	};

	// GET /gb/topics
	topics = async (req, res) => {
		console.log('topics', req.query);
		let resp = {};
		try {
			const SQL = `select id,topic_name,active_genies from genie_topics`;
			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			console.log('topics result', result);
			return res.send({
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while gett topics',
			});
		}
	};
	// GET /gb/topicsforgenie
	// topics = async (req, res) => {
	// 	console.log('topics', req.query);
	// 	let genieId = req.query.genieId;
	// 	genieId = 1;
	// 	let resp = {};
	// 	try {
	// 		// const SQL = `select id,topic_name,active_genies from genie_topics`;
	// 		const SQL = `SELECT
	// 		gt.id,
	// 		gt.topic_name,
	// 		gt.active_genies,
	// 		CASE
	// 		  WHEN gtf.genie_id IS NOT NULL THEN 1
	// 		  ELSE 0
	// 		END AS topic_exists
	// 	 FROM
	// 		genie_topics gt
	// 	 LEFT JOIN
	// 		genie_topic_for_genie gtf
	// 	ON
	// 	   gt.id = gtf.topic_id AND gtf.genie_id = ${genieId}
	// 	WHERE
	//      gt.is_active = 1;`;
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

	//PUT /gb/updategenietopic
	updateTopics = async (req, res) => {
		// console.log('updategenietopic', req);
		let genieId = req.query.genieId; // from aUTH MIDDLEWARE
		genieId = 1;
		const topic_exists = req.body.topic_exists;
		const topic_id = req.body.topic_id;

		let resp = {};
		try {
			let SQL = '';
			// switch (topic_exists) {
			// 	case 'true':
			// 		SQL = `INSERT INTO genie_topic_for_genie (genie_id, topic_id) VALUES (${genieId}, ${getFixedValue(
			// 			topic_id,
			// 		)})`;
			// 		break;
			// 	case false:
			// 		SQL = `DELETE FROM genie_topic_for_genie WHERE genie_id = ${genieId} AND topic_id = ${getFixedValue(
			// 			topic_id,
			// 		)}`;
			// 		break;
			// }
			// const result = await this.sequelize.query(SQL, {
			// 	type: QueryTypes.SELECT,
			// });
			let replacements = {
				genieId: genieId,
				topicId: getFixedValue(topic_id),
			};

			switch (topic_exists) {
				case 'true':
					SQL = `INSERT INTO genie_topic_for_genie (genie_id, topic_id) VALUES (:genieId, :topicId)`;
					break;
				case false:
					SQL = `DELETE FROM genie_topic_for_genie WHERE genie_id = :genieId AND topic_id = :topicId`;
					break;
			}

			const result = await this.sequelize.query(SQL, {
				replacements: replacements,
				type: QueryTypes.SELECT,
			});

			console.log('updategenietopic result', result);
			return res.send({
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,

				message: 'Some error occurred while update topics',
			});
		}
	};
	//POST /gb/genie
	genieChat = async (req, res) => {
		//we have to check that this is the current post by:its genie turn, its geniew id,its post id, its open, the talk field corect ,1 or 2 or 3
		console.log('geniesChat', req.body);
		let { userId, postId, genie_fild, text } = req.body;
		userId = 1;
		if (!userId || !postId || !genie_fild) {
			return res.send('no userId or post_id or genie_fild ');
		}
		if (genie_fild > 3 || genie_fild < 1) {
			return res.send('genie_fild Error');
		}

		if (!text || text.length > 3000) {
			return res.send('no text or text too long');
		}

		let genieId = req.query.genieId; // from aUTH MIDDLEWARE

		let resp = {};
		try {
			let replacements = {
				genieFieldText: text,
				userId: userId,
				postId: postId,
			};

			let additionalCondition =
				genie_fild === '3' ? `,post_status='closed'` : '';

			let SQL = `
				update genie_posts
				set genie_${genie_fild}=:genieFieldText, genie_${genie_fild}_date=now()
				${additionalCondition}
				where genie_id=:userId and is_active=1 and is_block=0
				and ( genie_${genie_fild} is null or genie_${genie_fild}='' )
				and postId=:postId
		  `;

			const result = await this.sequelize.query(SQL, {
				replacements: replacements,
				type: QueryTypes.UPDATE,
			});

			// let SQL = `update genie_posts
			// set genie_${genie_fild}='${text}',genie_${genie_fild}_date=now()
			// ${genie_fild === '3' ? `,post_status='closed'` : ''}
			// where  genie_id=${userId} and is_active=1 and is_block=0
			// and ( genie_${genie_fild} is null or genie_${genie_fild}='' )
			// and postId='${postId}'`;
			// const result = await this.sequelize.query(SQL, {
			// 	type: QueryTypes.UPDATE,
			// });
			console.log('geniesChat result', result);
			return res.status(200).send({ status: 'success' });
		} catch (e) {
			console.log('geniesChat error', e);
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while geniesChat',
			});
		}
	};
}
export default GenieController;
