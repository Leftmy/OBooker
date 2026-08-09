/**
 * @openapi
 * /api/v1/rooms:
 *   post:
 *     tags: [Rooms]
 *     summary: Create a room
 *     description: Create a new room with name, capacity, and floor. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoomCreateRequest'
 *           example:
 *             name: "Mars Conference Room"
 *             capacity: 10
 *             floor: 3
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoomResponse'
 *             example:
 *               id: "c9c22886-f14d-4bc0-93a9-19fc16dbbf89"
 *               name: "Mars Conference Room"
 *               capacity: 10
 *               floor: 3
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Capacity must be a positive integer"
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
 * /api/v1/rooms:
 *   get:
 *     tags: [Rooms]
 *     summary: List rooms
 *     description: Retrieve a list of all rooms with optional filtering by capacity and sorting. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minCapacity
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter rooms by minimum capacity
 *         example: 10
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum: [name, capacity, floor]
 *           default: name
 *         description: Field to sort rooms by
 *         example: capacity
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order direction
 *         example: desc
 *     responses:
 *       200:
 *         description: Rooms returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoomResponse'
 *             example:
 *               - id: "c9c22886-f14d-4bc0-93a9-19fc16dbbf89"
 *                 name: "Mars Conference Room"
 *                 capacity: 10
 *                 floor: 3
 *               - id: "d12837d0-1a6e-41a4-9271-bfbd564d309f"
 *                 name: "Aquarium"
 *                 capacity: 5
 *                 floor: 2
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "minCapacity must be a positive integer"
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
 * /api/v1/rooms/{id}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get a room by id
 *     description: Retrieve detailed information for a specific room. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "c9c22886-f14d-4bc0-93a9-19fc16dbbf89"
 *     responses:
 *       200:
 *         description: Room returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoomResponse'
 *             example:
 *               id: "c9c22886-f14d-4bc0-93a9-19fc16dbbf89"
 *               name: "Mars Conference Room"
 *               capacity: 10
 *               floor: 3
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Room not found"
 */
/**
 * @openapi
 * /api/v1/rooms/{id}:
 *   patch:
 *     tags: [Rooms]
 *     summary: Update a room
 *     description: Partially update a room's details. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "c9c22886-f14d-4bc0-93a9-19fc16dbbf89"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoomUpdateRequest'
 *           example:
 *             capacity: 15
 *     responses:
 *       200:
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoomResponse'
 *             example:
 *               id: "c9c22886-f14d-4bc0-93a9-19fc16dbbf89"
 *               name: "Mars Conference Room"
 *               capacity: 15
 *               floor: 3
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Capacity must be a positive integer"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Room not found"
 */
/**
 * @openapi
 * /api/v1/rooms/{id}:
 *   delete:
 *     tags: [Rooms]
 *     summary: Delete a room
 *     description: Permanently delete a room by ID. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "c9c22886-f14d-4bc0-93a9-19fc16dbbf89"
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Room deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Room not found"
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
