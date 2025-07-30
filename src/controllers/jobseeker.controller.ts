import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sendResponse } from "../helpers/ResponseService";
import { OpenAI } from "openai";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import { Readable } from "stream";
import { logResumeAIPrompt, updateResumeAIPromptLog } from '../services/resumeaiPromptLog.service';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import bcrypt from 'bcrypt';

export const getJobseekerApplications = async (req: Request, res: Response) => {
  try {
    const user_id = Number(req.user?.user_id);
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
    const { job_id, jobseeker_id } = req.body;

    // Validate input
    if (!job_id || !jobseeker_id) {
      return sendResponse(res, false, null, "job_id and jobseeker_id are required.", 400);
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { job_id: job_id },
    });
    if (!job) {
      return sendResponse(res, false, null, "Job not found.", 404);
    }

    // Check for existing application
    const existingApplication = await prisma.application.findFirst({
      where: {
        application_job_id: job_id,
        application_jobseeker_id: jobseeker_id,
      },
    });
    if (existingApplication) {
      return sendResponse(res, false, null, "You have already applied to this job.", 409);
    }

    // Create new application
    const application = await prisma.application.create({
      data: {
        application_job_id: job_id,
        application_jobseeker_id: jobseeker_id,
        application_status: "PENDING", // or your default status
      },
    });

    return sendResponse(res, true, { application_id: application.application_id }, "Job applied successfully.", 201);
  } catch (err) {
    console.error("[Apply Job Error]", err);
    return sendResponse(res, false, null, "Internal server error.", 500);
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
    const user_id = Number(req.user?.user_id);
    const jobseeker_id = undefined; // req.user does not have jobseeker_id
    const prompt = req.body.prompt;
    const model_used = 'gpt-4o';
    const prompt_type = 'full_resume';

    // 1. Log the prompt before sending to GPT
    const promptLog = await logResumeAIPrompt({
      user_id,
      jobseeker_id,
      prompt_text: prompt,
      prompt_type,
      model_used,
    });

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

    let gpt_response = '';
    let status = 'completed';
    let error_message = '';
    let chatCompletion;
    try {
      chatCompletion = await openai.chat.completions.create({
        model: model_used,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });
      gpt_response = chatCompletion.choices[0].message.content || '';
    } catch (error: any) {
      status = 'error';
      error_message = error.message || 'Unknown error';
    }

    // 2. Update the log with the response or error
    await updateResumeAIPromptLog({
      log_id: promptLog.resumeai_prompt_log_id,
      gpt_response,
      status,
      error_message,
      model_used,
    });

    if (status === 'error') {
      return sendResponse(res, false, null, error_message, 500);
    }

    let resumeJson: any;
    try {
      // Remove ```json and ``` if present
      const cleaned = gpt_response
        .replace(/^```json\s*/i, '') // remove starting ```json (case insensitive)
        .replace(/```$/, '') // remove ending ```
        .trim();
    
      resumeJson = JSON.parse(cleaned);
    } catch (error) {
      console.error("Invalid JSON from GPT:", gpt_response);
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
      const cleanedText = gpt_response?.trim().match(/\{[\s\S]*\}/)?.[0];
      if (!cleanedText) throw new Error("No JSON object found");

      resumeData = JSON.parse(cleanedText);
    } catch (error) {
      console.error("Invalid JSON from GPT:", gpt_response);
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
      log_id: promptLog.resumeai_prompt_log_id,
    });

  } catch (error) {
    console.error("Resume generation error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const generateResumeArray = async (
  req: Request,
  res: Response,
  _next?: NextFunction
): Promise<void> => {
  try {
    const user_id = Number(req.user?.user_id);
    const jobseeker_id = undefined;
    const prompt = req.body.prompt;
    const model_used = 'gpt-4o';
    const prompt_type = 'full_resume_array';

    const promptLog = await logResumeAIPrompt({
      user_id,
      jobseeker_id,
      prompt_text: prompt,
      prompt_type,
      model_used,
    });

    const systemPrompt = `
You are a resume generator assistant.

Your job is to extract detailed resume information from the user's prompt and return it as a single JSON object inside an array. Use this exact schema:

[
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
]

Instructions:
- Use all the information provided in the user's prompt.
- If a section (like experience, projects, certifications, etc.) is clearly mentioned in the prompt, extract it accurately.
- If a section is **not mentioned at all**, insert a realistic, generic placeholder or dummy content so that the resume looks complete and professional.
- The summary should always exist, even if basic.
- All content should look natural and formatted as if coming from a real resume.
- Do NOT fabricate personal data like name, email, or phone. Leave them empty if not mentioned.
- Output only valid JSON. No markdown, no explanations, no comments.
`;


    let gpt_response = '';
    let status = 'completed';
    let error_message = '';
    let chatCompletion;

    try {
      chatCompletion = await openai.chat.completions.create({
        model: model_used,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });

      gpt_response = chatCompletion.choices[0].message.content || '';
    } catch (error: any) {
      status = 'error';
      error_message = error.message || 'Unknown error';
    }

    await updateResumeAIPromptLog({
      log_id: promptLog.resumeai_prompt_log_id,
      gpt_response,
      status,
      error_message,
      model_used,
    });

    if (status === 'error') {
      return sendResponse(res, false, null, error_message, 500);
    }

    let resumeArray: any = null;
    try {
      const cleaned = gpt_response?.trim().match(/\[[\s\S]*\]/)?.[0];
      if (!cleaned) throw new Error("No JSON array found");
      resumeArray = JSON.parse(cleaned);
    } catch (err) {
      console.error("Invalid JSON from GPT:", gpt_response);
      return sendResponse(res, false, null, "Failed to parse resume data from AI.", 500);
    }

    return sendResponse(res, true, { resume: resumeArray[0], log_id: promptLog.resumeai_prompt_log_id }, "Resume generated successfully");
  } catch (error) {
    console.error("Resume generation error:", error);
   return sendResponse(res, false, null, "Resume generation error", 500);
  }
};

export const updateResumeSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = Number(req.user?.user_id);
    const jobseeker_id = undefined;
    const { section, prompt, currentResume } = req.body;
    const model_used = 'gpt-4o';
    const prompt_type = `section_${section}`;

    if (!section || !prompt || !currentResume) {
      return sendResponse(res, false, null, 'Missing required fields.', 400);
    }

    const promptLog = await logResumeAIPrompt({
      user_id,
      jobseeker_id,
      prompt_text: prompt,
      prompt_type,
      model_used,
    });

    const systemPrompt = `
You are a resume assistant.

Your task is to ONLY update the "${section}" section of the resume based on the user prompt.

Strictly follow these rules:
- Do NOT touch or mention any other section.
- Return only valid JSON like:
{
  "${section}": [...] // For sections like education, experience, skills
}
OR
{
  "${section}": "" // For summary, job_title, etc.
}
- NO markdown, no explanations, no comments, no formatting like \`\`\`.
- Preserve the structure of the current resume.
`;

    let gpt_response = '';
    let status = 'completed';
    let error_message = '';
    let completion;

    try {
      completion = await openai.chat.completions.create({
        model: model_used,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Current Resume: ${JSON.stringify(currentResume)}` },
          { role: 'user', content: `User wants to update ${section}: ${prompt}` }
        ],
        temperature: 0.5,
      });

      gpt_response = completion.choices[0].message.content || '';
    } catch (error: any) {
      status = 'error';
      error_message = error.message || 'Unknown error';
    }

    await updateResumeAIPromptLog({
      log_id: promptLog.resumeai_prompt_log_id,
      gpt_response,
      status,
      error_message,
      model_used,
    });

    if (status === 'error') {
      return sendResponse(res, false, null, error_message, 500);
    }

    const cleaned = gpt_response
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();

    let updateJson: any;
    try {
      const parsed = JSON.parse(cleaned);

      // Normalize structure if wrapped incorrectly
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
      console.error('Invalid JSON from GPT during section update:', gpt_response);
      return sendResponse(res, false, null, 'Failed to parse updated section from GPT.', 500);
    }

    // Merge updated section into the resume
    const mergedResume = {
      ...currentResume,
      [section]: updateJson[section],
    };

    // Optionally render HTML via EJS (can be removed if returning only JSON)
    const templatePath = path.join(__dirname, '../../views/resume.ejs');
    const html = await ejs.renderFile(templatePath, mergedResume);

    // Send merged object + optionally HTML if you want
    return sendResponse(res, true, {
      resume: mergedResume,
      updated_section: section,
      html,
      log_id: promptLog.resumeai_prompt_log_id,
    }, `Resume section "${section}" updated successfully`);
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

export const scoreResume = async (req: Request, res: Response) => {
  try {
   const resumeJson = req.body.resumeJson;
    // Compose the scoring prompt
    const scoringPrompt = `
You are a resume reviewer for software engineering jobs.
Given the following resume, score it from 1 to 100 (100 = excellent, 1 = poor).
Provide a JSON response: { "score": <number>, "reason": "<short explanation>" }
Resume:
${JSON.stringify(resumeJson, null, 2)}
`;

    // Call GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: scoringPrompt },
        { role: "user", content: JSON.stringify(resumeJson, null, 2) },
      ],
      temperature: 0.2,
    });

    const gptResult = completion.choices[0].message.content || "";
    let score = null, reason = "";
    try {
      const parsed = JSON.parse(
        gptResult.replace(/^```json\s*/i, "").replace(/```$/, "").trim()
      );
      score = parsed.score;
      reason = parsed.reason;
    } catch (err) {
      return sendResponse(res, false, null, "Failed to parse GPT score.", 500);
    }

    return sendResponse(res, true, { score, reason }, "Resume scored successfully.");
  } catch (err) {
    console.error("[Score Resume Error]", err);
    return sendResponse(res, false, null, "Internal server error.", 500);
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
    const jobseekerId = req.user?.user_id;
    
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

export const viewAppliedJobs = async (req: Request, res: Response) => {
  try {
    const jobseeker_id = Number(req.user?.user_id);
    const search = (req.query.search as string) || '';
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const skip = (page - 1) * limit;

    if (!jobseeker_id) {
      return sendResponse(res, false, null, 'Valid jobseeker_id is required.', 400);
    }

    // Build job filter
    const jobFilter: any = {};
    if (search) {
      jobFilter.job_title = { contains: search, mode: 'insensitive' };
    }

    // Find applications with job info
    const [total, applications] = await Promise.all([
      prisma.application.count({
        where: {
          application_jobseeker_id: jobseeker_id,
          job: jobFilter,
        },
      }),
      prisma.application.findMany({
        where: {
          application_jobseeker_id: jobseeker_id,
          job: jobFilter,
        },
        include: {
          job: {
            select: {
              job_id: true,
              job_title: true,
              job_location: true,
            },
          },
        },
        orderBy: { applied_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const results = applications.map(app => ({
      job_id: app.job?.job_id,
      job_title: app.job?.job_title,
      location: app.job?.job_location,
      application_date: app.applied_at,
    }));

    return sendResponse(res, true, {
      jobs: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }, 'Applied jobs fetched successfully.');
  } catch (err) {
    console.error('[View Applied Jobs Error]', err);
    return sendResponse(res, false, null, 'Internal server error.', 500);
  }
};

export const resetJobseekerPassword = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return sendResponse(res, false, null, 'Unauthorized', 401);
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return sendResponse(res, false, null, 'All password fields are required.', 400);
    }

    if (newPassword !== confirmPassword) {
      return sendResponse(res, false, null, 'New passwords do not match.', 400);
    }

    // Fetch jobseeker
    const jobseeker = await prisma.user.findUnique({
      where: { user_id },
      select: { user_password: true },
    });

    if (!jobseeker || !jobseeker.user_password) {
      return sendResponse(res, false, null, 'Jobseeker not found.', 404);
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, jobseeker.user_password);
    if (!isMatch) {
      return sendResponse(res, false, null, 'Old password is incorrect.', 400);
    }

    // Optionally: check password strength here

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { user_id },
      data: { user_password: hashedPassword },
    });

    return sendResponse(res, true, null, 'Password updated successfully.');
  } catch (err) {
    console.error('[Reset Jobseeker Password Error]', err);
    return sendResponse(res, false, null, 'Internal server error.', 500);
  }
};

export const updateResumeObj = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return sendResponse(res, false, null, 'Unauthorized', 401);
    }
    const { resume_obj, jr_name, jr_score, jr_score_reason } = req.body;
    const jobseeker_id = await prisma.jobseeker.findUnique({
      where: { jobseeker_user_id: user_id },
      select: { jobseeker_id: true },
    });
    if (!jobseeker_id) {
      return sendResponse(res, false, null, 'Jobseeker not found.', 404);
    } 
    const resume = await prisma.jobseeker_resumes.create({
      data: {
        jobseeker_id: jobseeker_id.jobseeker_id,
        jr_resume_obj: resume_obj,
        jr_name,
        jr_score,
        jr_score_reason,
      },
    });
    return sendResponse(res, true, resume, 'Resume updated successfully.');
  } catch (err) {
    console.error('[Update Resume Obj Error]', err);  
    return sendResponse(res, false, null, 'Internal server error.', 500);
  }
};

export const getSavedResumes = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return sendResponse(res, false, null, 'Unauthorized', 401);
    }

    // Find jobseeker_id for the user
    const jobseeker = await prisma.jobseeker.findUnique({
      where: { jobseeker_user_id: user_id },
      select: { jobseeker_id: true },
    });

    if (!jobseeker) {
      return sendResponse(res, false, null, 'Jobseeker not found.', 404);
    }

    // Retrieve all saved resumes for the jobseeker
    const resumes = await prisma.jobseeker_resumes.findMany({
      where: { jobseeker_id: jobseeker.jobseeker_id },
      orderBy: { created_at: 'desc' },
    });

    return sendResponse(res, true, resumes, 'Saved resumes retrieved successfully.');
  } catch (err) {
    console.error('[Get Saved Resumes Error]', err);
    return sendResponse(res, false, null, 'Internal server error.', 500);
  }
};

export const getSavedResumeById = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return sendResponse(res, false, null, 'Unauthorized', 401);
    }

    const { jr_id } = req.params;
    if (!jr_id) {
      return sendResponse(res, false, null, 'Resume ID (jr_id) is required.', 400);
    }

    // Find jobseeker_id for the user
    const jobseeker = await prisma.jobseeker.findUnique({
      where: { jobseeker_user_id: user_id },
      select: { jobseeker_id: true },
    });

    if (!jobseeker) {
      return sendResponse(res, false, null, 'Jobseeker not found.', 404);
    }

    // Retrieve the specific resume by jr_id and jobseeker_id
    const resume = await prisma.jobseeker_resumes.findFirst({
      where: {
        jr_id: Number(jr_id),
        jobseeker_id: jobseeker.jobseeker_id,
      },
    });

    if (!resume) {
      return sendResponse(res, false, null, 'Resume not found.', 404);
    }

    return sendResponse(res, true, resume, 'Resume retrieved successfully.');
  } catch (err) {
    console.error('[Get Saved Resume By Id Error]', err);
    return sendResponse(res, false, null, 'Internal server error.', 500);
  }
};

export const updateResumeManually = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) {
      return sendResponse(res, false, null, 'Unauthorized', 401);
    }

    const { jr_id, jr_resume_obj } = req.body;

    if (!jr_id || !jr_resume_obj) {
      return sendResponse(res, false, null, 'Both jr_id and jr_resume_obj are required.', 400);
    }

    // Find jobseeker_id for the user
    const jobseeker = await prisma.jobseeker.findUnique({
      where: { jobseeker_user_id: user_id },
      select: { jobseeker_id: true },
    });

    if (!jobseeker) {
      return sendResponse(res, false, null, 'Jobseeker not found.', 404);
    }

    // Update the resume
    const updatedResume = await prisma.jobseeker_resumes.updateMany({
      where: {
        jr_id: Number(jr_id),
        jobseeker_id: jobseeker.jobseeker_id,
      },
      data: {
        jr_resume_obj: jr_resume_obj,
        updated_at: new Date(),
        updated_by: user_id.toString(),
      },
    });

    if (updatedResume.count === 0) {
      return sendResponse(res, false, null, 'Resume not found or not updated.', 404);
    }

    return sendResponse(res, true, null, 'Resume updated successfully.');
  } catch (err) {
    console.error('[Update Resume Obj Error]', err);
    return sendResponse(res, false, null, 'Internal server error.', 500);
  }
};


