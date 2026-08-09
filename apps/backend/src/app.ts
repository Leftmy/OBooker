import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import v1Router from './v1.router';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', v1Router);

export { app };