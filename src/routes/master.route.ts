import { Router } from 'express';
import { getAllJobCategories, createJobCategory, getSingleJobCategory, getAllJobTypes, createJobType, getSingleJobType, createBulkJobCategories, createBulkJobTypes } from '../controllers/master.controller';

const router = Router();

router.get('/job-categories', getAllJobCategories);
router.post('/job-categories', createJobCategory);
router.get('/job-categories/:job_category_id', getSingleJobCategory);
router.post('/job-categories/bulk', createBulkJobCategories);

router.get('/job-types', getAllJobTypes);
router.post('/job-types', createJobType);
router.post('/job-types/bulk', createBulkJobTypes);
router.get('/job-types/:job_type_id', getSingleJobType);


export default router;
