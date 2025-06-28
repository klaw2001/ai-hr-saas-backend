import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendResponse } from '../helpers/ResponseService';

const prisma = new PrismaClient();

export const getJobseekerProfile = async (req: Request, res: Response) => {
  try {
    // SNIPPET: user-id
    const user_id = req.user?.user_id;
    
    const jobseeker = await prisma.jobseeker.findUnique({
      where: { jobseeker_user_id: user_id },
    });

    if (!jobseeker) {
      return sendResponse(res, false, null, 'Profile not found', 404);
    }

    sendResponse(res, true, jobseeker, 'Profile fetched successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};

export const saveJobseekerProfile = async (req: Request, res: Response) => {
  try {
    const {
      jobseeker_id, // optional, for update
      jobseeker_full_name,
      jobseeker_phone,
      jobseeker_resume_url,
      jobseeker_skills,
      jobseeker_experience_years,
      jobseeker_bio,
    } = req.body;

    const user_id = req.user?.user_id;
    if (!user_id) {
      return sendResponse(res, false, null, 'User ID is required.', 400);
    }

    let jobseeker;

    if (jobseeker_id) {
      // Update existing profile
      jobseeker = await prisma.jobseeker.update({
        where: { jobseeker_id: jobseeker_id },
        data: {
          jobseeker_full_name,
          jobseeker_phone,
          jobseeker_resume_url,
          jobseeker_skills,
          jobseeker_experience_years,
          jobseeker_bio,
        },
      });
      sendResponse(res, true, jobseeker, 'Profile updated successfully');
    } else {
      // Create new profile
      // Check if profile already exists for this user
      const existing = await prisma.jobseeker.findUnique({
        where: { jobseeker_user_id: user_id },
      });
      if (existing) {
        return sendResponse(res, false, null, 'Profile already exists for this user.', 400);
      }
      jobseeker = await prisma.jobseeker.create({
        data: {
          jobseeker_user_id: user_id,
          jobseeker_full_name,
          jobseeker_phone,
          jobseeker_resume_url,
          jobseeker_skills,
          jobseeker_experience_years,
          jobseeker_bio,
        },
      });
      sendResponse(res, true, jobseeker, 'Profile created successfully');
    }
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};

export const getJobseekerApplications = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const applications = await prisma.application.findMany({
      where: { application_jobseeker_id: user_id },
      include: {
        job: true,
      },
    });

    sendResponse(res, true, applications, 'Applications fetched successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};

export const applyJob = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return sendResponse(res, false, null, 'User ID is required.', 400);
    }
    const { job_id, application_message, application_resume_url } = req.body;

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { job_id: job_id },
    });

    if (!job) {
      return sendResponse(res, false, null, 'Job not found', 404);
    }

    // Check if already applied
    const existingApplication = await prisma.application.findFirst({
      where: {
        application_jobseeker_id: user_id,
        application_job_id: job_id,
      },
    });

    if (existingApplication) {
      return sendResponse(res, false, null, 'You have already applied to this job', 400);
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        application_jobseeker_id: user_id,
        application_job_id: job_id,
        application_message,
        application_resume_url,
        application_status: 'PENDING', // or whatever default status
      },
    });

    sendResponse(res, true, application, 'Job application submitted successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};
