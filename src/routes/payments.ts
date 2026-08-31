import { Router } from 'express';
import { handleWebhook } from '../controllers/payments';

const router: Router = Router();

router.post('/webhook', handleWebhook);

export default router;