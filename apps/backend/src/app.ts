import express from 'express';
import cors from 'cors';
import v1Router from './v1.router';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', v1Router);

export { app };