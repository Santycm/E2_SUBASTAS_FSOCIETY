import {Router} from 'express';
import {getCategories, getCategoryById} from '../controllers/categories';

const router: Router = Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);

export default router;