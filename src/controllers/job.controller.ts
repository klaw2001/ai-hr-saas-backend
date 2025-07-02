import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendResponse } from '../helpers/ResponseService';
import axios from 'axios';

const prisma = new PrismaClient();

// Create a job
export const createJob = async (req: Request, res: Response) => {
  try {
    const {
      job_title,
      job_description,
      job_location,
      job_category_id,
      job_type_id,
      job_city,
      job_state,
      job_country,
      job_salary,
      job_remote,
      job_tags
    } = req.body;

    const employerUserId = req.user?.user_id; // JWT middleware adds req.user

    // Required fields based on updated schema
    if (
      !job_title ||
      !job_description ||
      !job_location ||
      !job_category_id ||
      !job_type_id
    ) {
      return sendResponse(
        res,
        false,
        null,
        'Title, description, location, job_category_id, and job_type_id are required.',
        400
      );
    }

    if (!employerUserId) {
      return sendResponse(res, false, null, 'Employer user ID is required.', 400);
    }

    // Find employer_id from user_id
    const employer = await prisma.employer.findUnique({
      where: { employer_user_id: employerUserId },
      select: { employer_id: true }
    });

    if (!employer) {
      return sendResponse(res, false, null, 'Employer not found.', 404);
    }

    const job = await prisma.job.create({
      data: {
        job_title: job_title,
        job_description: job_description,
        job_location: job_location,
        job_category: { connect: { job_category_id: Number(job_category_id) } },
        job_type: { connect: { job_type_id: Number(job_type_id) } },
        job_city: job_city || null,
        job_state: job_state || null,
        job_country: job_country || null,
        job_salary: job_salary || null,
        job_remote: typeof job_remote === 'boolean' ? job_remote : null,
        job_tags: Array.isArray(job_tags) ? job_tags : [],
        employer: { connect: { employer_id: employer.employer_id } }, 
        is_active: true,
      },
    });

    sendResponse(res, true, job, 'Job created successfully.', 201);
  } catch (err) {
    console.error('Create Job Error:', err);
    sendResponse(res, false, null, 'Internal server error.', 500);
  }
};

// Get all jobs (public)
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { is_active: true },
      include: {
        employer: { select: { employer_id: true, user: { select: { user_email: true } } } },
      },
    });
    sendResponse(res, true, jobs, 'Jobs fetched successfully.');
  } catch (err) {
    console.error('Get All Jobs Error:', err);
    sendResponse(res, false, null, 'Internal server error.', 500);
  }
};

// Get job by ID
export const getJobById = async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.jobId);
    const job = await prisma.job.findUnique({
      where: { job_id: jobId },
      include: {
        employer: { select: { employer_id: true, user: { select: { user_email: true } } } },
      },
    });

    if (!job) {
      return sendResponse(res, false, null, 'Job not found.', 404);
    }

    sendResponse(res, true, job, 'Job fetched successfully.');
  } catch (err) {
    console.error('Get Job by ID Error:', err);
    sendResponse(res, false, null, 'Internal server error.', 500);
  }
};

// Get all jobs for a specific employer
export const getJobsByEmployer = async (req: Request, res: Response) => {
  try {
    const employerId = Number(req.params.employerId);

    const jobs = await prisma.job.findMany({
      where: {
        job_employer_id: employerId,
        is_active: true,
      },
    });

    sendResponse(res, true, jobs, 'Jobs fetched for employer.');
  } catch (err) {
    console.error('Get Employer Jobs Error:', err);
    sendResponse(res, false, null, 'Internal server error.', 500);
  }
};

export const allJobs = async (req: Request, res: Response) => {
  try {
   const response = await axios.get('https://jobs.indianapi.in/jobs?limit=10' , {
    headers: {
      'X-Api-Key': `${process.env.INDIAN_API_KEY}`
    }
   })

   console.log(response);
   sendResponse(res, true, response.data, 'Jobs fetched successfully.');
  } catch (err) {
    console.error('Get All Jobs Error:', err);
    sendResponse(res, false, null, 'Internal server error.', 500);
  }
};