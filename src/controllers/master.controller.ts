import { sendResponse } from "../helpers/ResponseService";
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllJobCategories = async (req: Request, res: Response) => {
  try {
    const jobCategories = await prisma.job_category.findMany();
    sendResponse(res, true, jobCategories, 'Job categories fetched successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};

export const createJobCategory = async (req: Request, res: Response) => {
  try {
    const { job_category_name } = req.body;
    const jobCategory = await prisma.job_category.create({
      data: { job_category_name },
    });
    sendResponse(res, true, jobCategory, 'Job category created successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};

export const createBulkJobCategories = async (req: Request, res: Response) => {
  try {
    const { job_category_names } = req.body;
    const jobCategories = await prisma.job_category.createMany({
      data: job_category_names.map((name: string) => ({ job_category_name: name })),
    });
    sendResponse(res, true, jobCategories, 'Job categories created successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};

export const getSingleJobCategory = async (req: Request, res: Response) => {
  try {
    const { job_category_id } = req.params;
    const jobCategory = await prisma.job_category.findUnique({
      where: { job_category_id: Number(job_category_id) },
    });
    sendResponse(res, true, jobCategory, 'Job category fetched successfully');
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

export const createJobType = async (req: Request, res: Response) => {
  try {
    const { job_type_name } = req.body;
    const jobType = await prisma.job_type.create({
      data: { job_type_name },
    });
    sendResponse(res, true, jobType, 'Job type created successfully');
  } catch (err) { 
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};

export const createBulkJobTypes = async (req: Request, res: Response) => {
  try {
    const { job_type_names } = req.body;
    const jobTypes = await prisma.job_type.createMany({
      data: job_type_names.map((name: string) => ({ job_type_name: name })),
    });
    sendResponse(res, true, jobTypes, 'Job types created successfully');
  } catch (err) {   
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};

export const getSingleJobType = async (req: Request, res: Response) => {
  try {
    const { job_type_id } = req.params;
    const jobType = await prisma.job_type.findUnique({
      where: { job_type_id: Number(job_type_id) },
    });
    sendResponse(res, true, jobType, 'Job type fetched successfully');
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, 'Internal server error', 500);
  }
};




