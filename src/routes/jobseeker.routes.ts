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
  generateResume,
  updateResumeSection,
  downloadResume,
  shortlistJob,
  getShortlistedJobs,
  upsertJobseekerProfile,
  getJobseekerProfileById,
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

router.post('/profile/generate-resume', generateResume);
router.post('/profile/update-resume-section', updateResumeSection);
router.post('/profile/download-resume', downloadResume);

// ---------------------------------------Resume Routes-------------------------------------

// Shortlist a job
router.post('/shortlist', shortlistJob);
// Get all shortlisted jobs for the logged-in jobseeker
router.get('/shortlisted', getShortlistedJobs);

// New jobseeker_profile routes
router.post('/profile/upsert', upsertJobseekerProfile);
router.get('/profile/:jobseekerId', getJobseekerProfileById);


export default router;
