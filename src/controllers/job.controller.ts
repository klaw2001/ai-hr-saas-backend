import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sendResponse } from "../helpers/ResponseService";
import axios from "axios";

const prisma = new PrismaClient();

// Create a job
// JOB CREATION
// This endpoint allows employers to create a new job listing.
// export const createJob = async (req: Request, res: Response) => {
//   try {
//     const {
//       job_title,
//       job_description,
//       job_location,
//       job_category_id,
//       job_type_id,
//       job_city,
//       job_state,
//       job_country,
//       job_salary,
//       job_remote,
//       job_tags,
//       job_seniority,
//       employment_type,
//       job_url,
//       job_hash,
//       company_id,
//       company_name,
//       company_url,
//       job_company_website,
//       job_industry_collection, // should be array of strings
//       applicants_count,
//       linkedin_job_id,
//       application_active,
//       deleted
//     } = req.body;

//     const employerUserId = req.user?.user_id; // JWT middleware adds req.user

//     // Required fields based on updated schema
//     if (
//       !job_title ||
//       !job_description ||
//       !job_location ||
//       !job_category_id ||
//       !job_type_id
//     ) {
//       return sendResponse(
//         res,
//         false,
//         null,
//         "Title, description, location, job_category_id, and job_type_id are required.",
//         400
//       );
//     }

//     if (!employerUserId) {
//       return sendResponse(
//         res,
//         false,
//         null,
//         "Employer user ID is required.",
//         400
//       );
//     }

//     // Find employer_id from user_id
//     const employer = await prisma.employer.findUnique({
//       where: { employer_user_id: employerUserId },
//       select: { employer_id: true },
//     });

//     if (!employer) {
//       return sendResponse(res, false, null, "Employer not found.", 404);
//     }

//     const job = await prisma.job.create({
//       data: {
//         job_title,
//         job_description,
//         job_location,
//         job_category: { connect: { job_category_id: Number(job_category_id) } },
//         job_type: { connect: { job_type_id: Number(job_type_id) } },
//         job_city: job_city || null,
//         job_state: job_state || null,
//         job_country: job_country || null,
//         job_salary: job_salary || null,
//         job_remote: typeof job_remote === "boolean" ? job_remote : null,
//         job_tags: Array.isArray(job_tags) ? job_tags : [],
//         employer: { connect: { employer_id: employer.employer_id } },
//         is_active: true,
//         job_seniority: job_seniority || null,
//         employment_type: employment_type || null,
//         job_url: job_url || null,
//         job_hash: job_hash || null,
//         company_id: company_id ? Number(company_id) : null,
//         company_name: company_name || null,
//         company_url: company_url || null,
//         job_company_website: job_company_website || null,
//         job_industry_collection: Array.isArray(job_industry_collection) ? job_industry_collection : [],
//         applicants_count: applicants_count || null,
//         linkedin_job_id: linkedin_job_id ? Number(linkedin_job_id) : null,
//         application_active: typeof application_active === "boolean" ? application_active : true,
//         deleted: typeof deleted === "boolean" ? deleted : false,
//       },
//     });

//     sendResponse(res, true, job, "Job created successfully.", 201);
//   } catch (err) {
//     console.error("Create Job Error:", err);
//     sendResponse(res, false, null, "Internal server error.", 500);
//   }
// };

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
      job_tags,
      job_seniority,
      employment_type,
      job_url,
      job_hash,
      company_id,
      company_name,
      company_url,
      job_company_website,
      job_industry_collection, // should be array of strings
      applicants_count,
      linkedin_job_id,
      application_active,
      deleted
    } = req.body;

    // Required fields check
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
        "Title, description, location, job_category_id, and job_type_id are required.",
        400
      );
    }

    const job = await prisma.job.create({
      data: {
        job_title,
        job_description,
        job_location,
        // job_category: { connect: { job_category_id: Number(job_category_id) } },
        // job_type: { connect: { job_type_id: Number(job_type_id) } },
        job_city: job_city || null,
        job_state: job_state || null,
        job_country: job_country || null,
        job_salary: job_salary || null,
        job_remote: typeof job_remote === "boolean" ? job_remote : null,
        job_tags: Array.isArray(job_tags) ? job_tags : [],
        is_active: true,
        job_seniority: job_seniority || null,
        employment_type: employment_type || null,
        job_url: job_url || null,
        job_hash: job_hash || null,
        company_id: company_id ? Number(company_id) : null,
        company_name: company_name || null,
        company_url: company_url || null,
        job_company_website: job_company_website || null,
        job_industry_collection: Array.isArray(job_industry_collection) ? job_industry_collection : [],
        applicants_count: applicants_count || null,
        linkedin_job_id: linkedin_job_id,
        application_active: typeof application_active === "boolean" ? application_active : true,
        deleted: typeof deleted === "boolean" ? deleted : false,
      },
    });

    sendResponse(res, true, null, "Job created successfully.", 201);
  } catch (err) {
    console.error("Create Job Error:", err);
    sendResponse(res, false, null, "Internal server error.", 500);
  }
};



// Get all jobs (public)
export const getAllJobs = async (req: Request, res: Response) => {
  const user_id = req.user?.user_id // JWT middleware adds req.user
  try {
    const jobs = await prisma.job.findMany({
      include: {
        jobs_shortlisted: {
          where: { jobseeker_id: user_id }, // Filter by logged-in jobseeker
          select: { jobseeker_id: true },
        },
      },
      where: { is_active: true },
      // include: {
      //   employer: {
      //     select: { employer_id: true, user: { select: { user_email: true } } },
      //   },
      // },
    });
   
    sendResponse(res, true, jobs, "Jobs fetched successfully.");
  } catch (err) {
    console.error("Get All Jobs Error:", err);
    sendResponse(res, false, null, "Internal server error.", 500);
  }
};

// Get job by ID
export const getJobById = async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.jobId);
    const job = await prisma.job.findUnique({
      where: { job_id: jobId },
      include: {
        employer: {
          select: { employer_id: true, user: { select: { user_email: true } } },
        },
      },
    });

    if (!job) {
      return sendResponse(res, false, null, "Job not found.", 404);
    }

    sendResponse(res, true, job, "Job fetched successfully.");
  } catch (err) {
    console.error("Get Job by ID Error:", err);
    sendResponse(res, false, null, "Internal server error.", 500);
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

    sendResponse(res, true, jobs, "Jobs fetched for employer.");
  } catch (err) {
    console.error("Get Employer Jobs Error:", err);
    sendResponse(res, false, null, "Internal server error.", 500);
  }
};

export const allJobs = async (req: Request, res: Response) => {
  try {
    console.log("Running job fetch cron at", new Date().toISOString());
    const url =
      "https://api.coresignal.com/cdapi/v2/data_requests/job_base/filter";
    const headers = {
      accept: "application/json",
      apikey: "B4Bu6q0VISCPMHV9P05T4g7W7H1Fp905",
      "Content-Type": "application/json",
    };
    const data = {
      data_format: "json",
      limit: 10,
      filters: {
        created_at_gte: "2025-07-02 00:00:01",
        application_active: true,
        country: "India",
        industry: "Software development",
      },
    };

    try {
      const response = await axios.post(url, data, { headers });

      const requestId = response.data.request_id;
      console.log("Request ID:", requestId);
      if (!requestId) {
        console.error("No request ID found in response");
        return;
      }

      console.log("Waiting 5 minutes before checking for files...");
      await new Promise((resolve) => setTimeout(resolve, 300000));
      // Polling parameters
      const maxAttempts = 10;
      const pollIntervalMs = 20000; // 20 seconds

      let files = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const filesUrl = `https://api.coresignal.com/cdapi/v2/data_requests/${requestId}/files`;
          const filesResponse = await axios.get(filesUrl, {
            headers: {
              accept: "application/json",
              apikey: "B4Bu6q0VISCPMHV9P05T4g7W7H1Fp905",
            },
          });

          files = filesResponse.data.data_request_files;
          console.log("Fetched files for request:", files);
          if (files && files.length > 0) {
            console.log(`Files ready after ${attempt} attempt(s)`);
            break;
          } else {
            console.log(`Attempt ${attempt}: Files not ready yet, waiting...`);
            if (attempt < maxAttempts) {
              await new Promise((resolve) =>
                setTimeout(resolve, pollIntervalMs)
              );
            }
          }
        } catch (fileError) {
          console.error("Error fetching files for request:", fileError);
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
          }
        }
      }

      if (files && files.length > 0) {
        const filePath = files[0];
        // The file is a gzipped JSON file. We'll fetch and decompress it.
        const fileUrl = `https://api.coresignal.com/cdapi/v2/data_requests/${requestId}/files/${filePath}`;
        try {
          const fileRes = await axios.get(fileUrl, {
            headers: {
              accept: "application/gzip",
              apikey: "B4Bu6q0VISCPMHV9P05T4g7W7H1Fp905",
            },
            responseType: "arraybuffer", // Get raw gzipped data
          });

          // Decompress the gzipped JSON
          const zlib = await import("zlib");
          const decompressed = zlib.gunzipSync(Buffer.from(fileRes.data));
          const json = JSON.parse(decompressed.toString("utf-8"));
          console.log("Fetched and decompressed JSON:", json);
        } catch (jsonErr) {
          console.error("Error fetching or decompressing JSON file:", jsonErr);
        }
      } else {
        console.log("No files found in data_request_files after polling.");
      }
      // You can process or save the response here
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        console.warn(
          "Identical data request is already in progress. Skipping this cycle."
        );
        return;
      }
      console.error("Error fetching jobs:", error);
      throw error;
    }
  } catch (err) {
    console.error("Get All Jobs Error:", err);
    sendResponse(res, false, null, "Internal server error.", 500);
  }
};

