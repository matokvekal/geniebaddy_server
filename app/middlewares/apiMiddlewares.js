import express from 'express';
import cors from 'cors';
//import Parsing from './payloadParsing';
// import checkAuthentication from './authenticationMiddleware';
import config from "../config";

const origin = config.allowedOrigins.split(',');
console.log("api middleware",origin);
const middlewares = [
    cors({ credentials: true, origin:"*" }),
    express.urlencoded({ extended: true }),
    express.json(),

];

export default middlewares;


// app.use(cors({
//     origin : ['http://localhost','https://localhost', 'http://212.80.207.146','http://localhost:3000', 'https://212.80.207.146','https://localhost:3000'],// (Whatever your frontend url is)
//     credentials: true // <= Accept credentials (cookies) sent by the client
//   }));