const _S3 = require('aws-sdk/clients/s3');
const readLine = require('readline');

const S3Config = require('../config/S3Config.json');
const fs = require('fs');
import moment from 'moment';

// new s3 client credentials are in S3Config.json
const s3 = new _S3({
	region: S3Config.region,
	accessKeyId: S3Config.accessKeyId,
	secretAccessKey: S3Config.secretAccessKey,
});

// save document in AWS S3
export const saveFileInAWS = (file, owner_id) => {
	// turn passed file into stream
	const fileStream = fs.createReadStream(file.filepath);

	// build new file name
	const date = moment().format('DD-MM-YYYY HH:mm:ss'); // need time because S3 overwrites files with same name
	const fileName = `${owner_id}/${owner_id}-${date}`; // driver/document can add this for extra structure

	// s3 params
	const uploadParams = {
		Bucket: S3Config.bucket,
		Body: fileStream,
		Key: fileName.replace(/[^a-zA-Z0-9]/g, ''),
	};

	return s3.upload(uploadParams).promise();

	//returns
	// example:
	// {
	//   ETag: '"1b5df45083145f56b6c57222924033b1"',
	//   Location: 'https://commissaire-documents.s3.eu-central-1.amazonaws.com/100/100-21-03-2022%2016%3A14%3A41',
	//   key: '123/100-21-03-2022 16:14:41',
	//   Key: '123/100-21-03-2022 16:14:41',
	//   Bucket: 'commissaire-documents'
	// }
};

// get one specific file from AWS S3 based on key(path to file in S3)
export const getFileFromAWS = (key) => {
	try {
		const downloadParams = {
			Key: key,
			Bucket: S3Config.bucket,
		};
		console.log(
			's3.getObject(downloadParams)',
			s3.getObject(downloadParams).createReadStream(),
		);
		return s3.getObject(downloadParams).createReadStream();
	} catch (e) {
		console.log(e);
		return;
	}
};

export const processS3File = (key, res) => {
	const s3Config = {
		Key: key,
		Bucket: S3Config.bucket,
	};
	return new Promise((resolve, reject) => {
		let records = [];
		try {
			let readStream = s3.getObject(s3Config).createReadStream();
			let lineReader = readLine.createInterface({ input: readStream });
			lineReader
				.on('line', (line) => {
					records.push(line);
				})
				.on('close', () => {
					console.log('Finished processing S3 file.');
					resolve(records);
					res.send(records);
				});
		} catch (err) {
			console.log('Error: ', err);
			reject(err);
		}
	});
};

//returns:
// example:

// _readableState: ReadableState {
//   objectMode: false,
//   highWaterMark: 16384,
//   buffer: BufferList { head: null, tail: null, length: 0 },
//   length: 0,
//   pipes: [],
//   flowing: null,
//   ended: false,
//   endEmitted: false,
//   reading: false,
//   constructed: true,
//   sync: false,
//   needReadable: false,
//   emittedReadable: false,
//   readableListening: false,
//   resumeScheduled: false,
//   errorEmitted: false,
//   emitClose: true,
//   autoDestroy: true,
//   destroyed: false,
//   errored: null,
//   closed: false,
//   closeEmitted: false,
//   defaultEncoding: 'utf8',
//   awaitDrainWriters: null,
//   multiAwaitDrain: false,
//   readingMore: false,
//   dataEmitted: false,
//   decoder: null,
//   encoding: null,
//   [Symbol(kPaused)]: null
// },
// _events: [Object: null prototype] { prefinish: [Function: prefinish] },
// _eventsCount: 1,
// _maxListeners: undefined,
// _writableState: WritableState {
//   objectMode: false,
//   highWaterMark: 16384,
//   finalCalled: false,
//   needDrain: false,
//   ending: false,
//   ended: false,
//   finished: false,
//   destroyed: false,
//   decodeStrings: true,
//   defaultEncoding: 'utf8',
//   length: 0,
//   writing: false,
//   corked: 0,
//   sync: true,
//   bufferProcessing: false,
//   onwrite: [Function: bound onwrite],
//   writecb: null,
//   writelen: 0,
//   afterWriteTickInfo: null,
//   buffered: [],
//   bufferedIndex: 0,
//   allBuffers: true,
//   allNoop: true,
//   pendingcb: 0,
//   constructed: true,
//   prefinished: false,
//   errorEmitted: false,
//   emitClose: true,
//   autoDestroy: true,
//   errored: null,
//   closed: false,
//   closeEmitted: false,
//   [Symbol(kOnFinished)]: []
// },
// allowHalfOpen: true,
// [Symbol(kCapture)]: false,
// [Symbol(kCallback)]: null
// };

// will be used to show list of images, so user can select
// get all from "folder" AWS S3 => up to 1000 records max => after 1000 need pagination
export const getAllFilesFromAWSForCompany = (owner_id) => {
	const downloadAllParams = {
		Bucket: S3Config.bucket,
		Delimiter: '/',
		Prefix: `${owner_id}/`,
	};

	return s3.listObjectsV2(downloadAllParams).promise();
	// returns
	// example:

	// array of
	// {
	//   Key: '100/100-21-03-2022 15:40:25',
	//   LastModified: 2022-03-21T15:40:27.000Z,
	//   ETag: '"6bde464cdd5ea8480e4b580b23382c8a"',
	//   ChecksumAlgorithm: [],
	//   Size: 38088,
	//   StorageClass: 'STANDARD'
	// }
};

// in some point files need to be deleted, passing key from S3
export const deleteFileFromAWS = (key) => {
	const deleteParams = {
		Bucket: S3Config.bucket,
		Key: key,
	};

	return s3.deleteObject(deleteParams).promise();
};
