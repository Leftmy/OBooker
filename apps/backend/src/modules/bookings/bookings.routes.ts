/**
 * @openapi
 * /api/v1/bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking
 *     description: Create a new room booking. Requires authentication. Time slots must be aligned to 30-minute intervals, and duration must be between 30 minutes and 4 hours.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingCreateRequest'
 *           example:
 *             title: "Team Sync"
 *             roomId: "c9c22886-f14d-4bc0-93a9-19fc16dbbf89"
 *             startTime: "2026-09-01T10:00:00.000Z"
 *             endTime: "2026-09-01T12:00:00.000Z"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 *             example:
 *               id: "a123b456-c789-d012-e345-f67890123456"
 *               title: "Team Sync"
 *               roomId: "c9c22886-f14d-4bc0-93a9-19fc16dbbf89"
 *               userId: "b45037d0-1a6e-41a4-9271-bfbd564d309f"
 *               startTime: "2026-09-01T10:00:00.000Z"
 *               endTime: "2026-09-01T12:00:00.000Z"
 *       400:
 *         description: Validation error (e.g., bad duration, unaligned times, missing fields)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Duration must be between 30 minutes and 4 hours"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       409:
 *         description: Resource conflict (Room is already booked for this time)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Room is already booked for this time range"
 */
/**
 * @openapi
 * /api/v1/bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: List all bookings
 *     description: Retrieve a list of all user bookings. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking list returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingResponse'
 *             example:
 *               - id: "a123b456-c789-d012-e345-f67890123456"
 *                 title: "Team Sync"
 *                 roomId: "c9c22886-f14d-4bc0-93a9-19fc16dbbf89"
 *                 userId: "b45037d0-1a6e-41a4-9271-bfbd564d309f"
 *                 startTime: "2026-09-01T10:00:00.000Z"
 *                 endTime: "2026-09-01T12:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 */
/**
 * @openapi
 * /api/v1/bookings/my:
 *   get:
 *     tags: [Bookings]
 *     summary: Get my bookings
 *     description: Retrieve a list of the authenticated user's bookings, filtered by past or upcoming. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [upcoming, past]
 *         example: "upcoming"
 *     responses:
 *       200:
 *         description: My bookings returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BookingResponse'
 *             example:
 *               - id: "a123b456-c789-d012-e345-f67890123456"
 *                 title: "Team Sync"
 *                 roomId: "c9c22886-f14d-4bc0-93a9-19fc16dbbf89"
 *                 userId: "b45037d0-1a6e-41a4-9271-bfbd564d309f"
 *                 startTime: "2026-09-01T10:00:00.000Z"
 *                 endTime: "2026-09-01T12:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 */
/**
 * @openapi
 * /api/v1/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get one booking
 *     description: Retrieve a specific booking by ID. The booking must belong to the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "a123b456-c789-d012-e345-f67890123456"
 *     responses:
 *       200:
 *         description: Booking returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 *             example:
 *               id: "a123b456-c789-d012-e345-f67890123456"
 *               title: "Team Sync"
 *               roomId: "c9c22886-f14d-4bc0-93a9-19fc16dbbf89"
 *               userId: "b45037d0-1a6e-41a4-9271-bfbd564d309f"
 *               startTime: "2026-09-01T10:00:00.000Z"
 *               endTime: "2026-09-01T12:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       403:
 *         description: Access denied - Booking belongs to another user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Booking not found or access denied"
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Booking not found or access denied"
 */
/**
 * @openapi
 * /api/v1/bookings/{id}:
 *   delete:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     description: Cancel and delete a booking by ID. The booking must belong to the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "a123b456-c789-d012-e345-f67890123456"
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Booking canceled successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       403:
 *         description: Access denied - Booking belongs to another user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Booking not found or access denied"
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Booking not found or access denied"
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