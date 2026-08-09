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
