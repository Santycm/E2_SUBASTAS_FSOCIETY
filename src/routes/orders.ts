import { Router } from 'express';
import { getOrders, getOrder } from '../controllers/orders';

const router: Router = Router();

router.get('/', getOrders);
router.get('/:id', getOrder);

export default router;