import { Router } from 'express';
import { createJob, getAllJobs, getJobById, getJobsByEmployer } from '../controllers/job.controller';

const router = Router();

// Authenticated routes
router.post('/employer/create-job', createJob);
router.get('/', getAllJobs);
router.get('/employer/:employerId', getJobsByEmployer);
router.get('/:jobId', getJobById);

export default router;
