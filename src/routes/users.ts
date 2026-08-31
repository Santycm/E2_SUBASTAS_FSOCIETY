import { Router } from 'express';
import { getProfile } from '../controllers/users';

const router: Router = Router();

router.get('/me', getProfile);

export default router;