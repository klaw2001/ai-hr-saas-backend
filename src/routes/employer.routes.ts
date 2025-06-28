import { Router } from 'express';
import {
  getEmployerJobs,
  getEmployerProfile,
  updateEmployerProfile,
  getAllJobCategories,
  getAllJobTypes,
  getSingleEmployerJob,
} from '../controllers/employer.controller';

const router = Router();


router.get('/', getEmployerProfile);
router.put('/', updateEmployerProfile);
router.get('/jobs', getEmployerJobs);
router.get('/jobs/:job_id', getSingleEmployerJob);
router.get('/job-categories', getAllJobCategories);
router.get('/job-types', getAllJobTypes);


export default router;
