import BaseController from './baseController';
const { QueryTypes } = require('sequelize');
const { getFixedValue } = require('../utils/getFixedValues');

class ServerController extends BaseController {
	constructor(app, modelName, sequelize) {
		super(app, modelName, sequelize);
	}

	// GET api/gb/topics
	getTopics = async (req, res) => {
		console.log('at getTopics');
		// console.log('usertopics', req.query);

		try {
			const SQL = `
			SELECT id, topic_name, active_genies ,color
			FROM genie_topics 
			WHERE is_active = 1 
			ORDER BY used DESC
	  `;

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
				message: 'Some error occurred while get topics',
			});
		}
	};
}
export default ServerController;
