import { Router } from 'express';
import {
  getJobseekerProfile,
  getJobseekerApplications,
  applyJob,
  saveJobseekerProfile,
} from '../controllers/jobseeker.controller';

const router = Router();

router.get('/me', getJobseekerProfile);
router.post('/me', saveJobseekerProfile);

router.get('/applications', getJobseekerApplications);
router.post('/apply', applyJob);

export default router;
