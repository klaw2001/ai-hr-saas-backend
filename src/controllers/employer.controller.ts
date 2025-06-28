import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendResponse } from '../helpers/ResponseService';

const prisma = new PrismaClient();

export const getEmployerProfile = async (req: Request, res: Response) => {
  try {
    const employer = await prisma.employer.findUnique({
      where: { employer_user_id: req.user!.user_id },
    });

    if (!employer) {
      return sendResponse(res, false, null, 'Profile not found', 404);
    }

    sendResponse(res, true, employer, 'Profile fetched successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};

export const updateEmployerProfile = async (req: Request, res: Response) => {
  try {
    const {
      employer_company_name,
      employer_website,
      employer_location,
      employer_bio,
    } = req.body;

    const employer = await prisma.employer.update({
      where: { employer_user_id: req.user!.user_id },
      data: {
        employer_company_name,
        employer_website,
        employer_location,
        employer_bio,
      },
    });

    sendResponse(res, true, employer, 'Profile updated successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};

export const getEmployerJobs = async (req: Request, res: Response) => {
  const user_id = req.user?.user_id
  try {
    const employer = await prisma.employer.findUnique({
      where: { employer_user_id: user_id },
      select: { employer_id: true }
    });

    if (!employer) {
      return sendResponse(res, false, null, 'Employer not found', 404);
    }

    const jobs = await prisma.job.findMany({
      include: {
        job_category: true,
        job_type: true,
        applications: true
      },
      where: { job_employer_id: employer.employer_id }
    });

    sendResponse(res, true, jobs, 'Jobs fetched successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};

export const getSingleEmployerJob = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const { job_id } = req.params;

    // Find employer by user_id
    const employer = await prisma.employer.findUnique({
      where: { employer_user_id: user_id },
      select: { employer_id: true }
    });

    if (!employer) {
      return sendResponse(res, false, null, 'Employer not found', 404);
    }

    // Find job by job_id and employer_id
    const job = await prisma.job.findFirst({
      where: {
        job_id: Number(job_id),
        job_employer_id: employer.employer_id
      },
      include: {
        job_category: true,
        job_type: true,
        applications: true
      }
    });

    if (!job) {
      return sendResponse(res, false, null, 'Job not found', 404);
    }

    sendResponse(res, true, job, 'Job fetched successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};


export const getAllJobCategories = async (req: Request, res: Response) => {
  try {
    const jobCategories = await prisma.job_category.findMany();
    sendResponse(res, true, jobCategories, 'Job categories fetched successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};

export const getAllJobTypes = async (req: Request, res: Response) => {
  try {
    const jobTypes = await prisma.job_type.findMany();
    sendResponse(res, true, jobTypes, 'Job types fetched successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};
