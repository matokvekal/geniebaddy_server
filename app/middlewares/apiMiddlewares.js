import express from 'express';
import cors from 'cors';
import config from '../config';

// Only set specific origins in production; for development, you can allow all
const corsOptions = {
	credentials: true,
	origin: process.env.NODE_ENV === 'production' ? config.allowedOrigins : '*',
};

const middlewares = [
	cors(corsOptions),
	express.urlencoded({ extended: true }),
	express.json(),
];

export default middlewares;
