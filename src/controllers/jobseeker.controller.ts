import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sendResponse } from "../helpers/ResponseService";

const prisma = new PrismaClient();

export const getJobseekerApplications = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const applications = await prisma.application.findMany({
      where: { application_jobseeker_id: user_id },
      include: {
        job: true,
      },
    });

    sendResponse(res, true, applications, "Applications fetched successfully");
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, "Internal server error", 500);
  }
};

export const applyJob = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return sendResponse(res, false, null, "User ID is required.", 400);
    }
    const { job_id, application_message, application_resume_url } = req.body;

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { job_id: job_id },
    });

    if (!job) {
      return sendResponse(res, false, null, "Job not found", 404);
    }

    // Check if already applied
    const existingApplication = await prisma.application.findFirst({
      where: {
        application_jobseeker_id: user_id,
        application_job_id: job_id,
      },
    });

    if (existingApplication) {
      return sendResponse(
        res,
        false,
        null,
        "You have already applied to this job",
        400
      );
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        application_jobseeker_id: user_id,
        application_job_id: job_id,
        application_message,
        application_resume_url,
        application_status: "PENDING", // or whatever default status
      },
    });

    sendResponse(
      res,
      true,
      application,
      "Job application submitted successfully"
    );
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, "Internal server error", 500);
  }
};

// ----------------------------------------Profile Start-------------------------------------

export const getJobseekerProfile = async (req: Request, res: Response) => {
  try {
    // SNIPPET: user-id
    const user_id = req.user?.user_id;

    const jobseeker = await prisma.jobseeker.findUnique({
      where: { jobseeker_user_id: user_id },
    });

    if (!jobseeker) {
      return sendResponse(res, false, null, "Profile not found", 404);
    }

    sendResponse(res, true, jobseeker, "Profile fetched successfully");
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, "Internal server error", 500);
  }
};

export const addProfile = async (req: Request, res: Response) => {
  try {
    const {
      jobseeker_id,
      first_name,
      last_name,
      email,
      phone,
      address,
      country_id,
      state_id,
      city_id,
      area_id,
      zip_code,
      resume_url,
      bio,
    } = req.body;

    await prisma.u_profile.upsert({
      where: { jobseeker_id: jobseeker_id },
      update: {
        up_first_name: first_name,
        up_last_name: last_name,
        up_email: email,
        up_phone: phone,
        up_address: address,
        up_country_id: country_id,
        up_state_id: state_id,
        up_city_id: city_id,
        up_area_id: area_id,
        up_zip_code: zip_code,
        up_resume_url: resume_url,
        up_bio: bio,
      },
      create: {
        jobseeker_id: jobseeker_id,
        up_first_name: first_name,
        up_last_name: last_name,
        up_email: email,
        up_phone: phone,
        up_address: address,
        up_country_id: country_id,
        up_state_id: state_id,
        up_city_id: city_id,
        up_area_id: area_id,
        up_zip_code: zip_code,
        up_resume_url: resume_url,
        up_bio: bio,
      },
    });

    const qualification = await prisma.u_qualifications.findFirst({
      where: {
        jobseeker_id: jobseeker_id,
      },
    });

    if (!qualification) {
      await prisma.u_qualifications.create({
        data: {
          jobseeker_id: jobseeker_id,
        },
      });
    }

    return sendResponse(res, true, null, "Profile added successfully");
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, "Internal server error", 500);
  }
};

export const addRecentJob = async (req: Request, res: Response) => {
  try {
    const { jobseeker_id, recent_job_title, recent_company } = req.body;
    await prisma.u_qualifications.update({
      where: {
        jobseeker_id: jobseeker_id,
      },
      data: {
        uq_recent_job_title: recent_job_title,
        uq_recent_company: recent_company,
      },
    });

    return sendResponse(res, true, null, "Recent job added successfully");
  } catch (error) {
    console.log(error);
    return sendResponse(res, false, null, "Internal server error", 500);
  }
};

export const addEducation = async (req: Request, res: Response) => {
  try {
    const {
      ue_id,
      ue_jobseeker_id,
      uq_id,
      ue_level_of_education,
      ue_field_of_study,
      ue_uni_name,
      ue_start_date,
      ue_end_date,
    } = req.body;

    const education = await prisma.u_educations.upsert({
      where: {
        ue_id,
      },
      update: {
        ue_level_of_education,
        ue_field_of_study,
        ue_uni_name,
        ue_start_date,
        ue_end_date,
      },
      create: {
        ue_jobseeker_id,
        uq_id,
        ue_level_of_education,
        ue_field_of_study,
        ue_uni_name,
        ue_start_date,
        ue_end_date,
      },
    });

    return sendResponse(
      res,
      true,
      education,
      "Education added/updated successfully"
    );
  } catch (error) {
    console.log(error);
    return sendResponse(res, false, null, "Internal server error", 500);
  }
};

export const addSkill = async (req: Request, res: Response) => {
  try {
    const { us_id, us_jobseeker_id, uq_id, us_skill, us_years_of_experience } =
      req.body;

    const skill = await prisma.u_skills.upsert({
      where: {
        us_id,
      },
      update: {
        us_skill,
        us_years_of_experience,
      },
      create: {
        us_jobseeker_id,
        uq_id,
        us_skill,
        us_years_of_experience,
      },
    });

    return sendResponse(res, true, skill, "Skill added/updated successfully");
  } catch (error) {
    console.log(error);
    return sendResponse(res, false, null, "Internal server error", 500);
  }
};

export const addCertification = async (req: Request, res: Response) => {
  try {
    const {
      uc_id,
      uc_jobseeker_id,
      uq_id,
      uc_cert_name,
      uc_cert_url,
      uc_expiration,
    } = req.body;

    const certification = await prisma.u_certifications.upsert({
      where: {
        uc_id,
      },
      update: {
        uc_cert_name,
        uc_cert_url,
        uc_expiration,
      },
      create: {
        uc_jobseeker_id,
        uq_id,
        uc_cert_name,
        uc_cert_url,
        uc_expiration,
      },
    });

    return sendResponse(
      res,
      true,
      certification,
      "Certification added/updated successfully"
    );
  } catch (error) {
    console.log(error);
    return sendResponse(res, false, null, "Internal server error", 500);
  }
};

export const addLicense = async (req: Request, res: Response) => {
  try {
    const {
      ulc_id,
      ulc_jobseeker_id,
      uq_id,
      ulc_license_name,
      ulc_license_url,
      ulc_expiration,
    } = req.body;

    const license = await prisma.u_licenses.upsert({
      where: {
        ulc_id,
      },
      update: {
        ulc_license_name,
        ulc_license_url,
        ulc_expiration,
      },
      create: {
        ulc_jobseeker_id,
        uq_id,
        ulc_license_name,
        ulc_license_url,
        ulc_expiration,
      },
    });

    return sendResponse(
      res,
      true,
      license,
      "License added/updated successfully"
    );
  } catch (error) {
    console.log(error);
    return sendResponse(res, false, null, "Internal server error", 500);
  }
};

export const addLanguage = async (req: Request, res: Response) => {
  try {
    const { ul_id, ul_jobseeker_id, uq_id, ul_language_name, ul_proficiency } =
      req.body;

    const language = await prisma.u_languages.upsert({
      where: {
        ul_id,
      },
      update: {
        ul_language_name,
        ul_proficiency,
      },
      create: {
        ul_jobseeker_id,
        uq_id,
        ul_language_name,
        ul_proficiency,
      },
    });

    return sendResponse(
      res,
      true,
      language,
      "Language added/updated successfully"
    );
  } catch (error) {
    console.log(error);
    return sendResponse(res, false, null, "Internal server error", 500);
  }
};

//-----------------------------------------Profile Ends-------------------------------------
