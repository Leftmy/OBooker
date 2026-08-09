import { Router } from 'express';
import authRouter from './modules/auth/auth.routes';

const v1Router = Router();

v1Router.use('/auth', authRouter);
// v1Router.use('/rooms', roomsRouter);
// v1Router.use('/bookings', bookingsRouter);

export default v1Router;