import axios from "axios";
import { CronJob } from "cron";

export const fetchJobsFromCoreSignal = new CronJob(
  "0 */15 * * * *", // Every 15 minutes
  async function () {
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
          const decompressedString = decompressed.toString("utf-8");
          
          // Log the first 500 characters to debug
          console.log("Decompressed data preview:", decompressedString.substring(0, 500));
          
          let json;
          try {
            json = JSON.parse(decompressedString);
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            console.error("Decompressed data length:", decompressedString.length);
            console.error("Decompressed data (first 1000 chars):", decompressedString.substring(0, 1000));
            
            // Try to find valid JSON by looking for the first { and last }
            const firstBrace = decompressedString.indexOf('{');
            const lastBrace = decompressedString.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              const jsonSubstring = decompressedString.substring(firstBrace, lastBrace + 1);
              try {
                json = JSON.parse(jsonSubstring);
                console.log("Successfully parsed JSON after trimming");
              } catch (trimError) {
                console.error("Failed to parse even after trimming:", trimError);
                return;
              }
            } else {
              console.error("Could not find valid JSON structure");
              return;
            }
          }
          
          // Write the decompressed JSON to a file instead of logging
          const fs = await import("fs/promises");
          await fs.writeFile("coresignal_data.json", JSON.stringify(json, null, 2), "utf-8");
          console.log("Fetched and decompressed JSON written to coresignal_data.json");
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
  }
);
