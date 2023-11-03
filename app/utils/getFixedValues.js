const moment = require('moment');

const getFixedValue = (value) => {
	const regex = /[']/g;
	const valueType = typeof value;
	const returnValue = value
		? `'${(valueType === 'object'
				? moment(value).format('YYYY-MM-DD HH:mm:ss')
				: value.toString()
		  ).replace(regex, "\\'")}'`
		: `null`;
	return returnValue;
};

const getFixedValueAndEqualSign = (value) => {
	const v = getFixedValue(value);
	return value ? `=${v}` : ` IS ${v}`;
};

module.exports = { getFixedValue, getFixedValueAndEqualSign };
