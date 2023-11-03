import config from '../config/config.json';
const fs = require('fs');
const csv = require('csvtojson');
const { QueryTypes } = require('sequelize');

const parseForm = async (meta, form, req) => {

   try {
	form.parse(req, function (error, fields, file) {
		if (!file || !file.file.originalFilename) {
			console.log('Err no file upload1');
			return res.status(401).json({ message: 'Err no file upload1' });
		}
		if (
			file.file.mimetype !== 'text/csv' ||
			file.file.size > meta.maxFileSize ||
			file.file.size === 0
		) {
			console.log('Err  file must be csv and size up to 5 MB');
			return res.status(401).json({ message: 'Err  file must be csv and size up to 5 MB' });
		}
		meta.raceDate = fields.raceDate;
		meta.branch = fields.branch;
		meta.place = fields.place;
		meta.year = fields.year;
		meta.fileOriginName = file.file.originalFilename;
		meta.fileSize = file.file.size;
		meta.fileName = file.file.newFilename;
		meta.filepath = file.file.filepath;
		meta.fileName = meta.fileName.slice(0, config.maxFileNameSize);
		meta.newPath = './files/' + meta.fileName;

		meta.rows = 0;
		meta.totalRows = 0;
		meta.totalRounds = 0;
		meta.newAppName;
		meta.rowsinChank = config.rowsinChank; //5Mb file= 200 rows, 16Mb file=600

		const data = fs.readFileSync(meta.filepath, 'UTF-8');
		const lines = data.split(/\r?\n/);
		const headers = lines[0].split(',');

		fs.writeFile(meta.newPath, lines.join('\n'), function (err) {
			if (err) return console.log(err);
			console.log('the file header has change');
		});
		return meta;
	});
} catch (e) {
   console.log(e);
}
};

const runQuery = async (SQL, query) => {
	try {

		const lookup = await query(SQL, {
			type: QueryTypes.INSERT,
		});
		return lookup;
	} catch (e) {
		console.log(e);
	}
};

module.exports = { parseForm, runQuery };
