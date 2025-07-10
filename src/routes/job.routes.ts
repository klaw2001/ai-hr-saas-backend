import { Router } from 'express';
import { allJobs, createJob, getAllJobs, getJobById, getJobsByEmployer } from '../controllers/job.controller';

const router = Router();

// Authenticated routes
router.post('/create-job', createJob);
router.get('/', getAllJobs);
router.get('/employer/:employerId', getJobsByEmployer);
router.get('/single/:jobId', getJobById);
router.post('/all-jobs', allJobs);

export default router;
