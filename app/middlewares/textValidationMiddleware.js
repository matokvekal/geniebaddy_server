// Importing necessary constants
import { ServerLoginMessages } from '../constants/ServerMessages';

// Decide if input values should be cleaned. Set to true by default.
const shouldCleanValues = true;

// Define regular expressions for different levels of text validation
const regexSignsLevel2 = /[!@#$%^&*()+={}\[\];:<>\/]/gi; // Matches some special characters
const regexSignsLevel3 = /['.,!@#$%^&*()+={}\[\];:<>\/]/gi; // Matches stronger set of special characters
const regexSqlInjection = /\b(and|exec|insert|select|delete|update|count|limit|chr|mid|master|truncate|union|char|declare|script|or)\b/gi; // Matches common SQL injection terms

// Define fields that are allowed to contain all signs or some signs
const fieldsAllowAllSigns = ['date', 'from', /* ... other fields ... */, 'email', 'password'];
const fieldsAllowSomeSigns = ['mobile', 'phone', 'branch'];

// Define length limits for different fields
const lengthLimits = {
    default: 50,
    long: 200000,
    medium: 75,
    short: 70
};

// Define which fields adhere to which length limits
const fieldsWithLengthLong = ['fire_base_token', 'customer_icon', 'image'];
const fieldsWithLengthMedium = []; // Add any medium-length fields here

// Helper function to sanitize value from SQL injections
const cleanValueFromSqlInjection = (value) => value.replace(regexSqlInjection, '*');

// Helper function to sanitize value from unwanted special characters
const cleanValueFromSigns = (key, value) => {
    if (fieldsAllowAllSigns.includes(key)) return value;
    const regexToUse = fieldsAllowSomeSigns.includes(key) ? regexSignsLevel2 : regexSignsLevel3;
    return value.replace(regexToUse, '');
};

// Helper function to check if a value's length is acceptable
const checkValueLength = (key, value) => {
    const length = value.length;
    if (fieldsWithLengthLong.includes(key)) return length <= lengthLimits.long;
    if (fieldsWithLengthMedium.includes(key)) return length <= lengthLimits.medium;
    return length <= lengthLimits.default;
};

// Recursive function to sanitize an entire object's properties
const cleanAllValuesFromObject = (object) => {
    if (!object) return object;

    let cleanedObject = Array.isArray(object) ? [] : {}; // Determine if object is an array or plain object
    for (const [key, val] of Object.entries(object)) {
        if (typeof val === 'object') {
            // Recursively clean objects
            cleanedObject[key] = cleanAllValuesFromObject(val);
        } else {
            // Clean primitive values
            const cleanedValue = cleanValueFromSigns(key, cleanValueFromSqlInjection(val.toString()));
            if (!checkValueLength(key, cleanedValue)) throw new Error(`Length of ${key} is too long`);
            cleanedObject[key] = cleanedValue;
        }
    }
    return cleanedObject;
};

// Middleware function to apply text validation on request body and query
const textValidationMiddleware = (req, res, next) => {
    try {
        if (shouldCleanValues) {
            req.body = cleanAllValuesFromObject(req.body);
            req.query = cleanAllValuesFromObject(req.query);
        }
        next(); 
    } catch (err) {
        res.createErrorLogAndSend({
            message: `${ServerLoginMessages.FIELD_NOT_VALID} => ${err.message || err}`,
            status: 406
        });
    }
};


export default textValidationMiddleware;
