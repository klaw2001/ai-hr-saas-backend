import { Router } from 'express';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import jobseekerRoutes from './routes/jobseeker.routes';
import employerRoutes from './routes/employer.routes';
// import adminRoutes from './routes/admin.routes';
import { authenticate, authorize } from './middlewares/auth.middleware';
import masterRoutes from './routes/master.route';

const router = Router();

// ✅ Public Routes
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
// ✅ Authenticated Routes
// router.use('/jobs', authenticate, authorize(['EMPLOYER']), jobRoutes);


// ✅ Jobseeker Routes
// router.use('/jobseeker', authenticate, authorize(['JOBSEEKER']), jobseekerRoutes);
router.use('/jobseeker', jobseekerRoutes);

// ✅ Employer Routes
router.use('/employer', authenticate, authorize(['EMPLOYER']), employerRoutes);

router.use('/master', masterRoutes);

// ✅ Admin Routes
// router.use('/admin', authenticate, authorize(['ADMIN']), adminRoutes);

export default router;
