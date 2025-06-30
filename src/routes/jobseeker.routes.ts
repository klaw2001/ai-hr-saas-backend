import { Router } from 'express';
import {
  getJobseekerProfile,
  getJobseekerApplications,
  applyJob,
  addProfile,
  addEducation,
  addSkill,
  addCertification,
  addLanguage,
  addLicense,
  addRecentJob,
} from '../controllers/jobseeker.controller';

const router = Router();


router.get('/applications', getJobseekerApplications);
router.post('/apply', applyJob);

// ---------------------------------------Profile Routes-------------------------------------
router.get('/me', getJobseekerProfile);
router.post('/profile/education',addEducation);
router.post('/profile/skill',addSkill);
router.post('/profile/certification',addCertification);
router.post('/profile/license',addLicense);
router.post('/profile/recent-job',addRecentJob);
router.post('/profile/language',addLanguage)
router.post('/profile',addProfile);













export default router;
