import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import v1Router from './v1.router';
import { setupSwagger } from './config/swagger';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

setupSwagger(app);
app.use('/api/v1', v1Router);

export { app };