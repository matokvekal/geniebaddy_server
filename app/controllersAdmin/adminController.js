import BaseController from './baseController';
const { QueryTypes } = require('sequelize');
const { formidable } = require('formidable');
import config from '../config/config.json';
const fs = require('fs');
const csv = require('csvtojson');
const query = require('../services/db').query;

const { parseForm, runQuery } = require('../utils/forms');

class AdminController extends BaseController {
	constructor(app, modelName, sequelize) {
		super(app, modelName, sequelize);
	}

	// GET /api/admin/races
	getRaces = async (req, res) => {
		try {
			if (!req.owner_id) {
				// console.log("no req.owner_id at getraces");
				return res.status(401).json({ message: 'Error at getRaces' });
				// res.createErrorLogAndSend({
				// 	err:  'Something get wrong.',
				// });
			}
			const owner_id = req.owner_id;
			let offset = req.query.offset || 0;
			let limit = req.query.limit || 20;
			let search = req.query.search || null;
			let country = req.query.country || null;
			let year = req.query.year || null;

			if (search) {
				let arr = search.split(',');
				let search_first = arr[0] ? arr[0].trim() : null;
				let search_second = arr[1] ? arr[1].trim() : null;
				search = `and 
				(name like '%${search_first}%' 
				 or main_competition_name like '%${search_first}%'
				 or location like '%${search_first}%' 
				 or place like '%${search_first}%' `;

				if (search_second) {
					search = `${search} 
					or name like '%${search_second}%' 
					or main_competition_name like '%${search_second}%'
					or location like '%${search_second}%' 
					or place like '%${search_second}%' `;
				}
				search = `${search} )`;
			}
			if (country) {
				country = country.split(',');
				country = country.map((item) => `"${item}"`);
				search = `${search} and country in (${country})`;
			}
			if (year) {
				year = year.split(',');
				search = `${search} and year in (${year})`;
			}
			let orderBy = req.orderBy || 'expected_start_date';
			//groupBy
			let filter = req.filter || null;

			let SQL = `select id,branch,name,place,expected_start_date,expected_start_time,location,main_competition_name,
								Terms,main_competition_name,country,year,race_manager,manager_phone,main_commissaire,race_term_link
								from races
								where is_active=1 
								and is_public=1
								${search ? search : ''}
								order by "${orderBy}"
								limit ${limit}
								offset ${offset}
								`;
			//console.log(SQL);
			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			SQL = `select count(*) as count
								from races
								where is_active=1 
								and is_public=1
								and owner_id=${owner_id}
								${search ? search : ''}
								order by "${orderBy}"`;
			const total = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			const freeToken = req.freeToken;
			return res.status(500).send({
				freeToken,
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

	//POST/api/admin/uploadrace
	uploadRaceCsv = async (req, res) => {
		let sendErr = false;
		const meta = {};
		meta.maxFileSize = config.maxFileSize || 5 * 1000000;
		meta.response_count = 0;
		meta.ownerId = req.owner_id || 996; //GILAD AT TABLE USERS
		meta.raceDate = '';
		meta.fileOriginName = '';
		meta.sub_branch = '';
		meta.year = '';
		meta.race_name = '';
		meta.branch = '';
		meta.country = '';
		try {
			const form = formidable({ multiples: false });
			form.parse(req, function (error, fields, file) {
				if (error) {
					console.log('1 ERROR ' + error);
					sendErr = true;
				}
				if (!file || !file.file || !file.file.originalFilename) {
					1;
					// console.log('2 Err no file upload');
					sendErr = true;
					res.status(500).send('Error some problem in file');
				}
				if (
					(file.file.mimetype !== 'text/csv' &&
						file.file.mimetype !== 'text/plain') ||
					file.file.size > meta.maxFileSize ||
					file.file.size === 0
				) {
					console.log('3 Err  file must be csv and size up to 5 MB');
					sendErr = true;
				}

				meta.branch = fields.branch;
				meta.raceDate = fields.raceDate;
				meta.place = fields.place;
				meta.year = fields.year;
				meta.fileOriginName = file.file.originalFilename;
				meta.fileSize = file.file.size;
				meta.fileName = file.file.newFilename;
				meta.filepath = file.file.filepath;
				meta.fileName = meta.fileName.slice(0, config.maxFileNameSize);
				meta.newName = './files/' + meta.fileName;
				meta.sub_branch = fields.sub_branch;
				meta.race_name = fields.race_name;
				meta.country = fields.country;
				meta.rows = 0;
				meta.totalRows = 0;
				meta.totalRounds = 0;
				meta.newAppName;
				meta.rowsinChank = config.rowsinChank; //5Mb file= 200 rows, 16Mb file=600
				const data = fs.readFileSync(meta.filepath, 'UTF-8');
				const lines = data.split(/\r?\n/);
				const headers = lines[0].split(',');

				if (lines[1] && lines[1].split(',').length !== headers.length) {
					console.log(
						'4 Error -some problem in file, Hint remove extra comma!',
					);
					sendErr = true;
				}
				if (sendErr) {
					console.log('send error 1');
					res.status(500).send('Error some problem in file');
				} else {
					fs.writeFile(meta.newName, lines.join('\n'), function (err) {
						if (err) return console.log(err);
						console.log('the file header has change');
					});
					// meta.sub_branch = fields.sub_branch;
					// meta.race_name = fields.race_name;
					//1)insert new row to races not active
					let headerToInsert;
					let SQL = `insert into races
					(owner_id,branch,name,place,race_date,is_active,is_public,uploaded_file_name,temp_table_name,sub_branch,country,year)
						values
					(${meta.ownerId},"${meta.branch}","${meta.race_name}","${meta.place}","${meta.raceDate}",1,1,"${meta.fileOriginName}","${meta.fileName}","${meta.sub_branch}","${meta.country}","${meta.year}");`;
					query(
						SQL,
						function (result, fields) {
							//3)create new temp table with the race data
							console.log('finish 2 success insert to fields');
						},
						function (err) {
							console.log('Error 4 at insert race', err);
							res.status(500).send(err, 'Error at create table');
						},
					);

					SQL = `CREATE TABLE data_commissaire.${meta.fileName} (id INT NOT NULL AUTO_INCREMENT,createdAt DATETIME NULL DEFAULT now(),`;
					let i = 1;
					let temp = 0;
					let headerCounter = 0;
					headers.forEach((header) => {
						headerCounter++;
						if (!header || header === '') {
							header = `temp${temp++}`;
						}
						header = header.trim();
						header = header.split(' ').join('_');
						header = header.replaceAll('.', '_');
						header = header.replaceAll('%', '_');
						header = header.replaceAll('#', '_');
						header = header.replaceAll("'", '');
						header = header.replaceAll('Rank', '_rank');
						header = header.toLowerCase() === 'rank' ? '_rank' : header;
						headerToInsert = headerToInsert
							? `${headerToInsert}${header.trim()},`
							: `${header.trim()},`;
						SQL = ` ${SQL} ${header.trim()} VARCHAR(120) NULL,`;
					});
					SQL = ` ${SQL} PRIMARY KEY (id))`;
					// console.log(SQL)
					query(
						SQL,
						function (result, fields) {
							//4)insert the race data to temp table
							console.log('finish 3 success create table');
							let sqlStart = `INSERT INTO   data_commissaire.${meta.fileName} (`;
							let sqlEnd = '(';
							sqlStart = ` ${sqlStart}${headerToInsert.slice(0, -1)}) values `;
							let chank = 700;
							let columns;
							lines.forEach((row, index) => {
								if (index > 0) {
									if (row.length > 0) {
										columns = row.split(',');
										if (columns.length === headerCounter) {
											if (
												columns[0] !== headers[0] &&
												columns[1] !== headers[1]
											) {
												columns.forEach((column) => {
													sqlEnd = `${sqlEnd}"${column
														.replaceAll(',', ' ')
														.replaceAll('"', '')
														.trim()}",`;
												});
												sqlEnd = `${sqlEnd.slice(0, -1)}),(`;
											}
										}
										// else{
										// 	todo  if less then add null
										// 	if more the cut the extra
										// }
									}
									if (
										(index !== 0 && index % chank === 0) ||
										lines.length - 1 === index
									) {
										SQL = `${sqlStart} ${sqlEnd.slice(0, -2)}`;
										sqlEnd = '(';
										console.log('start 4 insert sql index:', index);
										// console.log(SQL);
										query(
											SQL,
											function (result, fields) {
												//5)insert the data from tem table to race_riders table
												console.log('finish 4 insert sql index:', index);
												SQL = `CALL insert_race_data("${meta.fileName}","${meta.country}",${meta.ownerId});`;
												// console.log(SQL);
												query(
													SQL,
													function (appsresult, fields) {
														console.log(
															'finish 5 insert riders and categories',
															index,
														);
														console.log('send ok  1');
														res.status(200).send('uploaded');
													},
													function (err) {
														console.log('send error 2');
														res.status(500).send({ success: false, err });
													},
												);
											},
											function (err) {
												console.log(
													'Error insert sql index:',
													index,
													'SQL:',
													SQL,
												);
												console.log('send error 3');
												res
													.status(500)
													.send(
														err,
														'Error -some problem in file, Hint remove extra comma!',
													);
											},
										);
									}
								}
								// res.send('finish')
							});
						},
						function (err) {
							console.log('Error 5 at create table', err);
							res.status(500).send(err, 'Error at create table');
						},
					);
				}
			});
			// res.send("finish");
			//BUGS
			//1 fix race name today its the file name
			//2 לבנות שדה סוג מרוץ  מתוך טבלה(אליפות ישראל,אליפות עולם דיסיפלינה משנה)
			//לבטל עמודה בלי קטגוריה
			//			return res.send('finish');
			// לעשות טרים על השדות
			//if not country set default to isr
			//if select count pos =0 update to pic
			//
		} catch (e) {
			console.log('Error 6 uploadcsv', err);
			return res.status(401).json({ message: 'Error at uploadcsv' });
		}
	};

	//////////////////////////////n o t   r e a d  y   y  e t  ////////////
	// GET /race_categories
	getRacesCategories = async (req, res) => {
		const owner_id = 996;
		let race_id = req.query.race;
		if (!race_id) {
			return res.createErrorLogAndSend({
				message: 'race_id is require.',
			});
		}
		try {
			const SQL = `SELECT c.id,c.race_name,c.category_id,c.category_name,c.laps,c.date,
		c.lap_distance,c.total_distance,c.participants,c.current_lap,c.start_time
		,c.finishers,c.need_bike_check,c.need_gear_check,c.color,c.status,
		c.commissaire_name,c.commissaire_role,c.need_bike_check,c.need_gear_check
		 from race_categories c
		 where 
		 c.race_id=${race_id}
		 and c.is_active=1 
		 and  c.is_public=1 
		 and owner_id=${owner_id}`;
			//console.log(SQL);
			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			const freeToken = req.freeToken;

			return res.status(500).end({
				freeToken,
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while getting race categories',
			});
		}
	};

	// GET /riders_laps   // not working
	getRaceRidersLaps = async (req, res) => {
		const owner_id = 996;
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
		order by race_category_id,race_rider_id,_rank`;

			//console.log(SQL);
			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			const freeToken = req.freeToken;

			return res.status(500).send({
				freeToken,
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while getting race riders',
			});
		}
	};

	// getRaceRiders = async (req, res) => {
	// 	const owner_id = 996;
	// 	let race_id = req.query.race;
	// 	let category_id = req.query.category;
	// 	if (!race_id) {
	// 		return res.createErrorLogAndSend({
	// 			message: 'race  is  require.',
	// 		});
	// 	}
	// 	try {
	// 		const SQL = `SELECT id,first_name,last_name,category,bib_number,
	// 	total_laps,total_distance,total_time,gap,dif,started_at,
	// 	club,country,need_bike_check,check_bike,
	// 	has_checked_and_ok
	// 	FROM race_riders
	// 	where is_active=1 and race_id = ${race_id}
	// 	${category_id ? ` and race_category_id = ${category_id}` : ''}
	// 	and is_public=1
	// 	order by id`;
	// 		//TODO if race not start then sort by rider bib number
	// 		//console.log(SQL);
	// 		const result = await this.sequelize.query(SQL, {
	// 			type: QueryTypes.SELECT,
	// 		});
	// 		const freeToken = req.freeToken;

	// 		return res.status(500).send({
	// 			freeToken,
	// 			result,
	// 		});
	// 	} catch (e) {
	// 		return await res.createErrorLogAndSend({
	// 			err: e,
	// 			message: 'Some error occurred while getting race riders',
	// 		});
	// 	}
	// };
	// GET /race_filter   not ready yet
	getRacesFilters = async (req, res) => {
		let country = req.query.country || null;
		let year = req.query.year || null;
		try {
			const SQL = `CALL getFiltersFreeRaces(${
				country ? `"${country}"` : null
			},${year})`;
			//console.log(SQL);
			const result = await this.sequelize.query(SQL);
			const freeToken = req.freeToken;

			return res.status(500).send({
				freeToken,
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while getting race filter',
			});
		}
	};

	// GET /menu
	menu = async (req, res) => {
		let resp = {};
		try {
			const SQL = `SELECT menu_name,menu_index,text,parent_id,link_to FROM menu WHERE menu_name = 'main' and role='free' and is_active=1`;
			const result = await this.sequelize.query(SQL, {
				type: QueryTypes.SELECT,
			});
			const freeToken = req.freeToken;

			return res.status(500).rsend({
				freeToken,
				result,
			});
		} catch (e) {
			return await res.createErrorLogAndSend({
				err: e,
				message: 'Some error occurred while getting free Menu',
			});
		}
	};

	// //POST/api/admin/cycling
	// config =async (req, res) => {
	// 	console.log("at config")
	// 	try {
	// 		if (!req || !req.body || !req.user_code) {
	// 			return res.send({ success: false, message: 'Error no data' });
	// 		}
	// 		if ( !req.user_code) {
	// 			return res.send({ success: false, message: 'Error no user_code' });
	// 		}

	// 	let user_code = req.user_code;

	// 	const SQL=` CALL commissaire.update_cycling_active('${user_code}','${type}',
	// 	'${nick_name}','${mobile}','${from}','${to}','${puncture}','${can_help}','${difribliator}','${first_aid}',
	// 	'${water}','${some_data}','${is_private}','${need_help}','${lng}','${lat}','${client_time}')`
	// 	const response = await this.sequelize.query(SQL, {
	// 		type: QueryTypes.SELECT,
	// 	});

	// 	if(response[0]==='false'){
	// 		return res.status(200).send({ success: false, message: 'Error at save config' });
	// 	}else{
	// 		return res.status(200).send({ success: true, message: 'config saved' });
	// 	}

	// 	} catch (e) {
	// 		console.log('Error at config');
	// 		return res.status(401).json({ message: 'Error at config' });
	// 	}
	// };
}
export default AdminController;
