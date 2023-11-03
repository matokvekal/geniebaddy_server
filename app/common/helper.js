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

const validPassword =(password)=>{
   return password.match(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
    );
}
const validateEmail = (email) => {
	return email.match(
	  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	);
 };
module.exports = { getFixedValue, validateEmail,validPassword };
