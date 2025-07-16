import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function logResumeAIPrompt({
  user_id,
  jobseeker_id,
  prompt_text,
  prompt_type,
  model_used,
}: {
  user_id: number;
  jobseeker_id?: number;
  prompt_text: string;
  prompt_type?: string;
  model_used?: string;
}) {
  return prisma.resumeai_prompt_log.create({
    data: {
      user_id,
      jobseeker_id,
      prompt_text,
      prompt_type,
      model_used,
      status: "pending",
    },
  });
}

export async function updateResumeAIPromptLog({
  log_id,
  gpt_response,
  status,
  error_message,
  model_used,
}: {
  log_id: number;
  gpt_response?: string;
  status: string;
  error_message?: string;
  model_used?: string;
}) {
  return prisma.resumeai_prompt_log.update({
    where: { resumeai_prompt_log_id: log_id },
    data: {
      gpt_response,
      status,
      error_message,
      model_used,
    },
  });
} 