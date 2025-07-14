import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sendResponse } from "../helpers/ResponseService";
import { OpenAI } from "openai";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import { Readable } from "stream";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// //-----------------------------------------Profile Ends-------------------------------------
import type { NextFunction } from "express";
import puppeteer from "puppeteer";

export const generateResume = async (
  req: Request,
  res: Response,
  _next?: NextFunction
): Promise<void> => {
  try {

    const { prompt } = req.body;

    if (!prompt) {
      return sendResponse(res, false, null, "Prompt is required.", 400);
    }

    const systemPrompt = `
You are a resume generator assistant.

Strictly follow these instructions:
- Only extract and use the data provided in the user's prompt.
- Do NOT assume or fabricate any information.
- If the prompt does not mention something (e.g. a project, certification), leave that field empty or as an empty list.
- Respond ONLY with a valid JSON object using this exact format:

{
  "full_name": "",
  "job_title": "",
  "email": "",
  "phone": "",
  "location": "",
  "summary": "",
  "experience": [
    {
      "company": "",
      "duration": "",
      "description": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "link": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "duration": "",
      "course": ""
    }
  ],
  "skills": [""],
  "certifications": [""]
}

Only return valid JSON. Do not include explanations or extra commentary.
`;

    
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const responseText = chatCompletion.choices[0].message.content || '';

    let resumeJson: any;
    try {
      // Remove ```json and ``` if present
      const cleaned = responseText
        .replace(/^```json\s*/i, '') // remove starting ```json (case insensitive)
        .replace(/```$/, '') // remove ending ```
        .trim();
    
      resumeJson = JSON.parse(cleaned);
    } catch (error) {
      console.error("Invalid JSON from GPT:", responseText);
      return sendResponse(
        res,
        false,
        null,
        "Failed to parse resume data from AI.",
        500
      );
    }

    let resumeData;
    try {
      const cleanedText = responseText?.trim().match(/\{[\s\S]*\}/)?.[0];
      if (!cleanedText) throw new Error("No JSON object found");

      resumeData = JSON.parse(cleanedText);
    } catch (error) {
      console.error("Invalid JSON from GPT:", responseText);
      return sendResponse(
        res,
        false,
        null,
        "Failed to parse resume data from AI.",
        500
      );
    }

    const templatePath = path.join(__dirname, '../../views/resume.ejs');
    const html = await ejs.renderFile(templatePath, resumeData);

    // Stream the HTML as a response
    // const stream = Readable.from(String(html));
    // res.setHeader('Content-Type', 'text/html');
    // stream.pipe(res);
    res.json({
      html,
      resume: resumeJson,
    });

  } catch (error) {
    console.error("Resume generation error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateResumeSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { section, prompt, currentResume } = req.body;

    if (!section || !prompt || !currentResume) {
      return sendResponse(res, false, null, 'Missing required fields.', 400);
    }

    const systemPrompt = `
You are a resume assistant.

Your task is to ONLY update the "${section}" section of the resume.

Follow these rules strictly:
- Do NOT modify any other section.
- Do NOT wrap the response in "div", "section", or other keys.
- ONLY return valid JSON in the exact format:
{
  "${section}": [...]
}
(Use object instead of array for sections like "summary", if applicable)

DO NOT include explanations, markdown, or formatting like \`\`\`.
Only valid JSON.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(currentResume) },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
    });

    const rawContent = completion.choices[0].message.content || '';

    // Clean triple backtick wrapper if present
    const cleaned = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();

    let updateJson: any;

    try {
      const parsed = JSON.parse(cleaned);

      // Handle wrong nesting: e.g. { div: { projects: [...] } }
      if (parsed[section]) {
        updateJson = parsed;
      } else if (parsed.div?.[section]) {
        updateJson = { [section]: parsed.div[section] };
      } else if (parsed.section?.[section]) {
        updateJson = { [section]: parsed.section[section] };
      } else {
        throw new Error(`Section "${section}" not found in GPT response`);
      }
    } catch (err) {
      console.error('Invalid JSON from GPT during section update:', rawContent);
      return sendResponse(res, false, null, 'Failed to parse updated section from GPT.', 500);
    }

    const mergedResume = {
      ...currentResume,
      [section]: updateJson[section],
    };

    const templatePath = path.join(__dirname, '../../views/resume.ejs');
    const html = await ejs.renderFile(templatePath, mergedResume);

    const stream = Readable.from(String(html));
    res.setHeader('Content-Type', 'text/html');
    stream.pipe(res);
  } catch (error) {
    console.error('[Update Resume Section Error]', error);
    return sendResponse(res, false, null, 'Internal server error while updating resume section.', 500);
  }
};


export const downloadResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resumeJson } = req.body;

    if (!resumeJson) {
      return sendResponse(res, false, null, 'resumeJson not provided in request body.', 400);
    }

    // Step 1: Render HTML from EJS template
    const templatePath = path.join(__dirname, '../../views/resume.ejs');
    const html: any = await ejs.renderFile(templatePath, resumeJson);

    // Step 2: Launch Puppeteer and render PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Generated PDF buffer is empty.');
    }

    // Step 3: Save PDF to public/uploads/resumes/
    const resumeDir = path.join(__dirname, '../../public/uploads/resumes');
    if (!fs.existsSync(resumeDir)) {
      fs.mkdirSync(resumeDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const fileName = `resume-${timestamp}.pdf`;
    const filePath = path.join(resumeDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    // Step 4: Return file path in response (relative to /public)
    const publicUrl = `/uploads/resumes/${fileName}`;
    return sendResponse(res, true, { file: publicUrl }, 'Resume PDF generated successfully');
  } catch (error: any) {
    console.error('[PDF Download Error]:', error.message || error);
    return sendResponse(res, false, null, 'Failed to generate PDF.', 500);
  }
};

// ------------------- Shortlist Jobs -------------------
export const shortlistJob = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const { job_id } = req.body;
    if (!user_id || !job_id) {
      return sendResponse(res, false, null, "User ID and job ID are required.", 400);
    }

    // Check if already shortlisted
    const existing = await prisma.jobs_shortlisted.findFirst({
      where: {
        jobseeker_id: user_id,
        job_id: job_id,
      },
    });
    if (existing) {
      return sendResponse(res, false, null, "Job already shortlisted.", 400);
    }

    const shortlist = await prisma.jobs_shortlisted.create({
      data: {
        jobseeker_id: user_id,
        job_id: job_id,
      },
    });
    return sendResponse(res, true, shortlist, "Job shortlisted successfully");
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, "Internal server error", 500);
  }
};

export const getShortlistedJobs = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return sendResponse(res, false, null, "User ID is required.", 400);
    }
    const shortlisted = await prisma.jobs_shortlisted.findMany({
      where: { jobseeker_id: user_id },
      include: { job: true },
    });
    return sendResponse(res, true, shortlisted, "Shortlisted jobs fetched successfully");
  } catch (err) {
    console.error(err);
    sendResponse(res, false, null, "Internal server error", 500);
  }
};

// New jobseeker_profile endpoints
export const upsertJobseekerProfile = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return sendResponse(res, false, null, "User ID is required.", 400);
    }

    // Find jobseeker_id from user_id
    const jobseeker = await prisma.jobseeker.findUnique({
      where: { jobseeker_user_id: user_id },
      select: { jobseeker_id: true },
    });

    if (!jobseeker) {
      return sendResponse(res, false, null, "Jobseeker not found.", 404);
    }

    const {
      profile_logo,
      full_name,
      job_title,
      phone,
      email,
      website,
      current_salary,
      expected_salary,
      experience,
      age,
      education_level,
      languages,
      categories,
      allow_in_listing,
      description,
      facebook_link,
      twitter_link,
      linkedin_link,
      google_plus_link,
      country,
      city,
      complete_address,
      map_address,
      latitude,
      longitude,
    } = req.body;

    const profile = await prisma.jobseeker_profile.upsert({
      where: { jobseeker_id: jobseeker.jobseeker_id },
      update: {
        profile_logo,
        full_name,
        job_title,
        phone,
        email,
        website,
        current_salary,
        expected_salary,
        experience,
        age,
        education_level,
        languages,
        categories: Array.isArray(categories) ? categories : [],
        allow_in_listing,
        description,
        facebook_link,
        twitter_link,
        linkedin_link,
        google_plus_link,
        country,
        city,
        complete_address,
        map_address,
        latitude,
        longitude,
      },
      create: {
        jobseeker_id: jobseeker.jobseeker_id,
        profile_logo,
        full_name,
        job_title,
        phone,
        email,
        website,
        current_salary,
        expected_salary,
        experience,
        age,
        education_level,
        languages,
        categories: Array.isArray(categories) ? categories : [],
        allow_in_listing,
        description,
        facebook_link,
        twitter_link,
        linkedin_link,
        google_plus_link,
        country,
        city,
        complete_address,
        map_address,
        latitude,
        longitude,
      },
    });

    sendResponse(res, true, profile, "Profile updated successfully.");
  } catch (err) {
    console.error("Upsert Jobseeker Profile Error:", err);
    sendResponse(res, false, null, "Internal server error.", 500);
  }
};

export const getJobseekerProfileById = async (req: Request, res: Response) => {
  try {
    const jobseekerId = Number(req.params.jobseekerId);
    
    if (!jobseekerId || isNaN(jobseekerId)) {
      return sendResponse(res, false, null, "Valid jobseeker ID is required.", 400);
    }

    const profile = await prisma.jobseeker_profile.findUnique({
      where: { jobseeker_id: jobseekerId },
      include: {
        jobseeker: {
          select: {
            jobseeker_id: true,
            user: {
              select: {
                user_email: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return sendResponse(res, false, null, "Profile not found.", 404);
    }

    sendResponse(res, true, profile, "Profile fetched successfully.");
  } catch (err) {
    console.error("Get Jobseeker Profile Error:", err);
    sendResponse(res, false, null, "Internal server error.", 500);
  }
};