/**
 * @openapi
 * /api/v1/rooms:
 *   post:
 *     tags: [Rooms]
 *     summary: Create a room
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Room created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
/**
 * @openapi
 * /api/v1/rooms:
 *   get:
 *     tags: [Rooms]
 *     summary: List rooms
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rooms returned
 *       401:
 *         description: Unauthorized
 */
/**
 * @openapi
 * /api/v1/rooms/{id}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get a room by id
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Room returned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 */
/**
 * @openapi
 * /api/v1/rooms/{id}:
 *   patch:
 *     tags: [Rooms]
 *     summary: Update a room
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Room updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 */
/**
 * @openapi
 * /api/v1/rooms/{id}:
 *   delete:
 *     tags: [Rooms]
 *     summary: Delete a room
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Room deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 */
import { Router } from 'express';
import { RoomsController } from './rooms.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';

const router = Router();
const controller = new RoomsController();

router.use(authMiddleware);

router.post('/', (req, res, next) => controller.create(req, res, next));
router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', (req, res, next) => controller.getOne(req, res, next));
router.patch('/:id', (req, res, next) => controller.update(req, res, next));
router.delete('/:id', (req, res, next) => controller.remove(req, res, next));

export default router;
