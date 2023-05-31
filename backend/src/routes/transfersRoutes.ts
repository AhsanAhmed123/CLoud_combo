import { Router } from 'express';
import { getTransfers } from '../controllers/transfersController';

const router = Router();

router.get('/get', getTransfers);



export default router;
