const { QueryTypes } = require('sequelize');

const fetchFromSp = async (req, tableName, sequelize, res, foundPermission) => {
	try {
		const owner_id = req.owner_id;
		let specific_filter = null;
		const {
			search = null,
			sortColumn = null,
			sortDirection = null,
			return_limit = 20, // default for now, maybe change this
			return_offset = 0, // default for now, maybe change this
			_column = null,
			_sign = null,
			_value = null,
			_from = null,
			_to = null,
			_status = null,
		} = req.query;

		if (!owner_id || !tableName) {
			return res.createErrorLogAndSend({
				message: `Err at fetchFromSp. - owner_id: ${owner_id} table_name:${tableName}`,
			});
		}
		//specific filter
		if (tableName === 'orders_containers') {
			if (_from && _to) {
				specific_filter = ` and  valid_until >= "${_from}" and valid_until <= "${_to}"`;
			}
			if (_status) {
				specific_filter = ` ${specific_filter} and status="${_status}"`;
			}
		}
		const fields_to_hide =null;
		const query = `CALL get_data_from_table_new(
			${owner_id},
			'${tableName}',
			${search ? `'${search}'` : null},
			${sortColumn ? `'${sortColumn}'` : null},
			${sortDirection ? `'${sortDirection}'` : null},
			${return_limit},
			${return_offset},
			${fields_to_hide ? `'${fields_to_hide}'` : null},
			${_column ? `'${_column}'` : null},
			${_sign ? `'${_sign}'` : null},
			${_value ? `'${_value}'` : null},
			${specific_filter ? `'${specific_filter}'` : null}
		)`;

		const response = await sequelize.query(query, {
			type: QueryTypes.SELECT,
			replacements:
				fields_to_hide && typeof fields_to_hide === 'object'
					? fields_to_hide
					: null,
		});

		if (response && response.length > 1) {
			const rows = Object.values(response[0]);
			if (rows[0] && rows[0].success === 'false') {
				return res.createErrorLogAndSend({
					err: { message: `ERROR IN SQL - ${rows[0].message}` },
				});
			}
			const total = response[1][0] ? response[1][0].totalRows : -1;
			return res.send({ rows, total });
		}
		return res.createErrorLogAndSend({
			message: `NO RESPONSE FOR getting ${tableName}`,
		});
	} catch (e) {
		console.log(e);
		return await res.createErrorLogAndSend({
			err: e,
			message: 'Some error occurred while getting data.',
		});
	}
};

export default fetchFromSp;
