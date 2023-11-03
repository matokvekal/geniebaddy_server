import BaseController from './baseController';
const { QueryTypes } = require('sequelize');

class PublicRacesController extends BaseController {
	constructor(app, modelName, sequelize) {
		super(app, modelName, sequelize);
	}
	// GET /api/free/races
	getFreeRaces = async (req, res) => {
		try {
			// console.log('start')
			let offset = req.query.skip || 0;
			let limit = req.query.limit || 20;
			let search = req.query.search || null;
			let country = req.query.country || null;
			let year = req.query.year || null;
			let branch = req.query.branch || null;

			if (search) {
				let sql = ' and (';
				search.split(' ').forEach((key) => {
					if (key && key != ' ') {
						sql = `${sql} 
				LOCATE('${key.trim()}',name) or 
				LOCATE('${key.trim()}',main_competition_name) or 
				LOCATE('${key.trim()}',location) or 
				LOCATE('${key.trim()}',place) or`;
					}
				});
				sql = sql.slice(0, -2);
				search = `${sql} )`;
				// console.log(search);
			}
			if (country) {
				country = country.split(',');
				country = country.map((item) => `'${item}'`);
				if (search) {
					search = `${search} and country in (${country})`;
				} else {
					search = `and country in (${country})`;
				}
			}
			if (year) {
				year = year.split(',');

				if (search) {
					search = `${search} and year in (${year})`;
				} else {
					search = `and year in (${year})`;
				}
			}
			let orderBy = req.orderBy || 'expected_start_date';
			//groupBy
			let filter = req.filter || null;
			let SQL = `select id,branch,name,place,expected_start_date,race_date,expected_start_time,location,main_competition_name,riders,
								Terms,main_competition_name,country,year,race_manager,manager_phone,main_commissaire,race_term_link,sub_branch
								from races
								where is_active=1 
								and is_public=1
								${search ? search : ''}
								${branch ? ` and FIND_IN_SET(branch,"${branch}")` : ''}
								order by '${orderBy}'
								limit ${limit}
								offset ${offset}
								`;
			//   console.log(SQL);
			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			SQL = `select count(*) as count
								from races
								where is_active=1 
								and is_public=1
								${search ? search : ''}
								order by '${orderBy}'`;
			const total = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			const token = req.token;

			return res.send({
				token,
				result,
				total,
			});
		} catch (err) {
			console.log(err);
			res.createErrorLogAndSend({
				err: err.message || 'Some error occurred in get Free Races.',
			});
		}
	};
	// GET /api/free/lastraces
	getFreelastRaces = async (req, res) => {
		try {
			let filter = req.filter || null;
			let SQL = `SELECT  id,branch,name,place,year FROM commissaire.races 
			where year !="0000-00-00"
			order by year desc,expected_start_date  desc limit 5`;
			//  console.log(SQL);
			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});

			const token = req.token;
			return res.send({
				token,
				result,
			});
		} catch (err) {
			console.log(err);
			res.createErrorLogAndSend({
				err: err.message || 'Some error occurred in get Free Races.',
			});
		}
	};
	// GET /api/free/race_categories
	getFreeRacesCategories = async (req, res) => {
		let race_id = req.query.race;
		if (!race_id) {
			return res.createErrorLogAndSend({
				message: 'race_id is require.',
			});
		}
		try {
			const SQL = `SELECT distinct c.id, c.race_name, c.category_name, c.laps, c.date,
       c.lap_distance, c.total_distance, c.participants, c.current_lap, c.start_time,
       c.finishers, c.need_bike_check, c.need_gear_check, c.color, c.status,
       c.commissaire_name, c.commissaire_role,
       (SELECT COUNT( *)
        FROM race_riders r
        WHERE r.race_id = c.race_id AND r.race_category_id = c.id) AS total_riders
		 FROM race_categories c
		 WHERE c.race_id = ${race_id} AND c.is_active = 1 AND c.is_public = 1
		 ORDER BY c.id`;
					// 	const SQL = `SELECT c.id,c.race_name,c.category_name,c.laps,c.date,
			// c.lap_distance,c.total_distance,c.participants,c.current_lap,c.start_time
			// ,c.finishers,c.need_bike_check,c.need_gear_check,c.color,c.status,
			// c.commissaire_name,c.commissaire_role,c.need_bike_check,c.need_gear_check
			//  from race_categories c
			//  where
			//  c.race_id=${race_id}
			//  and c.is_active=1
			//  and  c.is_public=1`;
			// console.log(SQL);
			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			const token = req.token;

			return res.send({
				token,
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while getting race categories',
			});
		}
	};
	// GET /api/free/riders_laps

	getFreeRaceRidersLaps = async (req, res) => {
		let race_id = req.query.race;
		let category_id = req.query.category;
		let race_rider_id = req.query.raceRiderId;
		if (!race_id) {
			return res.createErrorLogAndSend({
				message: 'race id is  require.',
			});
		}
		try {
			const SQL = `select lap_index,lap_time,start_time,arrive_rime,distance,_rank,gap,comment
		from rider_laps
		where 
		and is_active=1
		and is_public=1 
		and race_id=${race_id}
		${category_id ? `and race_category_id=${category_id}` : ''}
		${race_rider_id ? `and race_rider_id=${race_rider_id}` : ''}
		order by race_category_id,race_rider_id,id`;

			// console.log(SQL);
			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			const token = req.token;

			return res.send({
				token,
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while getting race riders',
			});
		}
	};

	// GET /api/free/race_riders
	getFreeRaceRiders = async (req, res) => {
		let race_id = req.query.race;
		let category_id = req.query.category;
		if (!race_id) {
			return res.createErrorLogAndSend({
				message: 'race  is  require.',
			});
		}
		try {
			const SQL = `SELECT distinct rc.id as race_id,rc.name as race_name,rc.place as race_place,
			rc.year as race_year,rc.race_date,rc.branch as race_branch, rr.id,rr.first_name,rr.last_name,rr.category,rr.bib_number,
			rr.total_laps,rr.total_distance,rr.total_time,rr.gap,rr.dif,rr.started_at,
			rr.club,rr.country,rr.need_bike_check,rr.check_bike,rr.race,
			rr.has_checked_and_ok
			FROM race_riders rr
			  left join races rc
			  on rc.id=rr.race_id
			where rr.is_active=1 and rr.race_id = ${race_id}
			${category_id ? ` and rr.race_category_id = ${category_id}` : ''}
			and rr.is_public=1  
			order by rc.id,rr.id`;
			// 	const SQL = `SELECT id,first_name,last_name,category,bib_number,
			// total_laps,total_distance,total_time,gap,dif,started_at,
			// club,country,need_bike_check,check_bike,race,
			// has_checked_and_ok
			// FROM race_riders
			// where is_active=1 and race_id = ${race_id}
			// ${category_id ? ` and race_category_id = ${category_id}` : ''}
			// and is_public=1
			// order by id`;
			//TODO if race not start then sort by rider bib number
			//console.log(SQL,1);
			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			const token = req.token;
			//console.log(SQL,1);
			return res.send({
				token,
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while getting race riders',
			});
		}
	};
	// GET /api/Free/race_filter   not ready yet
	getFreeRacesFilters = async (req, res) => {
		let country = req.query.country || null;
		let year = req.query.year || null;
		try {
			const SQL = `CALL getFiltersFreeRaces(${
				country ? `'${country}'` : null
			},${year})`;
			//console.log(SQL);
			const result = await this.sequelize.query(SQL);
			const token = req.token;

			return res.send({
				token,
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while getting race filter',
			});
		}
	};
	// GET /api/Free/menu
	getFreeRaceMenu = async (req, res) => {
		let resp = {};
		try {
			const SQL = `SELECT menu_name,menu_index,text,parent_id,link_to FROM menu WHERE menu_name = 'main' and role='free' and is_active=1`;
			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			const token = req.token;

			return res.send({
				token,
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while getting free Menu',
			});
		}
	};
	//GET/api/free/racefields
	getRaceFields = async (req, res) => {
		try {
			const SQL = `select f.field_name,f.label,f._type as type,f.type_data,f._order as 'order',f.can_search,f.user_hide,f.user_select,f.can_edit,f.can_add,f.column_width,
		 f.add_place_holder,f.drop_list_values,f.drop_list_Header,f.max_length,f.hide_in_client from  commissaire.fields_admin f  where
		 f.app_name = 'race_riders' and f.app_id=8888888 and f.is_active=1 and (f.hide_in_client =0  or hide_in_client is null) order by _order;`;
			//console.log(SQL);
			let result = await this.sequelize.query(SQL, { type: QueryTypes.SELECT });
			return res.status(200).send(result);
		} catch (e) {
			console.log('Error at getRaceFields');
			return res.status(401).json({ message: 'Error at getRaceFields' });
		}
	};

	//GET/api/free/racedata
	getFreeRaceData = async (req, res) => {
		try {
			// let sort ='race_id,category,cast(position_in_category as unsigned) asc,cast(position as unsigned) asc';
			let sort = 'rr.id';
			if (req.query.sort) {
				if (req.query.sort.includes('position')) {
					if (req.query.sort.includes('desc')) {
						sort = ' cast(position as unsigned) desc ';
					} else {
						sort = ' cast(position as unsigned) asc ';
					}
				} else if (req.query.sort.includes('position_in_category')) {
					if (req.query.sort.includes('desc')) {
						sort = ' cast(rr.position_in_category as unsigned) desc ';
					} else {
						sort = ' cast(rr.position_in_category as unsigned) asc ';
					}
				} else {
					sort = req.query.sort ? req.query.sort : sort;
				}
			}

			let raceId = req.query.raceId || null;
			let search = req.query.search || null;
			let finishers = req.query.finishers || null;
			let return_limit = req.query.limit || 20;
			if (return_limit > 100) {
				return_limit = 20;
			}
			let return_offset = req.query.skip || 0;
			console.log(return_offset);
			if (search) {
				let temp = ' and (';
				search.split(' ').forEach((key) => {
					if (key && key != ' ') {
						temp = `${temp} 
				(LOCATE('${key.trim()}',rr.first_name) or 
				LOCATE('${key.trim()}',rr.last_name) or 
				LOCATE('${key.trim()}',rr.race_name) or 
				LOCATE('${key.trim()}',rr.club) or 
				LOCATE('${key.trim()}',rr.branch) or 
				LOCATE('${key.trim()}',rr.category) or 
				LOCATE('${key.trim()}',rr.place) ) and`;
					}
				});
				temp = temp.slice(0, -3);
				search = `${temp} )`;
				console.log(search);
			}
			if (finishers) {
				search
					? (search = `${search} and position is not null  and position !="" and position !="DNF" and position !="DSQ" and position !="DNS" and position !="OTL" and(status is null or( status !="DNS" and status !="DSQ" and status !="OTL" and status !="DNF")) `)
					: (search = ` and position is not null and   position !="" and position !="DNF" and position !="DSQ" and position !="DNS" and position !="OTL" and(status is null or( status !="DNS" and status !="DSQ" and status !="OTL" and status !="DNF")) `);
			}
			let SQL = `select  distinct rc.id as race_id,rc.name as race_name,rc.place as place,rc.year as year,rc.race_date,rc.branch as branch,
			rr.rider_id,rr.race_category_id,rr.category,rr.first_name,rr.last_name,rr.id,
			rr.bib_number,rr.position,rr.position_in_category,rr.total_laps,rr.total_distance,rr.total_time,rr.gap,
			rr.dif,rr.club,rr.country,rr.need_bike_check,rr.check_bike,rr.city,rr.union_member,rr.has_checked_and_ok,rr.sub_branch,
			rr.stars,rr.love,rr.race
		FROM race_riders rr
		left join races rc
		on rc.id=rr.race_id
		where rr.is_active=1 
		and rr.is_public=1
		${raceId ? ' and rr.race_id =' + raceId : ''}
		${search ? search : ''}
		order by ${sort}
		limit ${return_limit}
		offset ${return_offset}
		`;
			//console.log(SQL);

			const rows = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			SQL = `select count(*) as count
		from race_riders as rr
		where rr.is_active=1 
		and rr.is_public=1
		${raceId ? ' and rr.race_id =' + raceId : ''}
		${search ? search : ''}
		order by rr.id desc`;

			//console.log(SQL);

			const totalRows = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			const token = req.token;
			return res.send({
				token,
				rows,
				totalRows,
			});
		} catch (e) {
			console.log(e);
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while getting data.',
			});
		}
	};
}
export default PublicRacesController;
