import { Router } from 'express';
import { BookingsController } from './bookings.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

const router = Router();
const controller = new BookingsController();

router.use(authMiddleware);

router.post('/', (req, res, next) => controller.create(req, res, next));
router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/my', (req, res, next) => controller.getMyBookings(req, res, next));
router.get('/:id', (req, res, next) => controller.getOne(req, res, next));
router.delete('/:id', (req, res, next) => controller.cancel(req, res, next));

export default router;