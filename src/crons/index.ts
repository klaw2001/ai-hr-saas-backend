import { fetchJobsFromCoreSignal } from "./allCrons";

export default function startCrons() {
  if (process.env.JOB_CRON === "run") {
    // fetchJobsFromCoreSignal.start();
  }
};