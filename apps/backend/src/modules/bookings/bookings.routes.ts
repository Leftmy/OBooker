/**
 * @openapi
 * /api/v1/bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Booking created
 *       401:
 *         description: Unauthorized
 */
/**
 * @openapi
 * /api/v1/bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: List bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking list returned
 *       401:
 *         description: Unauthorized
 */
/**
 * @openapi
 * /api/v1/bookings/my:
 *   get:
 *     tags: [Bookings]
 *     summary: Get my bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My bookings returned
 *       401:
 *         description: Unauthorized
 */
/**
 * @openapi
 * /api/v1/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get one booking
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking returned
 *       401:
 *         description: Unauthorized
 */
/**
 * @openapi
 * /api/v1/bookings/{id}:
 *   delete:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking cancelled
 *       401:
 *         description: Unauthorized
 */
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