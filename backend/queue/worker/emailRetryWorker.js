
// worker/emailRetryWorker.js
const { Worker } = require("bullmq");
const nodemailer = require("nodemailer");
const { bullMQConnection } = require("../../services/redisClient");
const { emailDLQ } = require("../queues/emailQueues");
require("dotenv").config({ path: "../../config/.env" });

console.log("🔁 Retry Worker started...");

const retryWorker = new Worker(
  "emailRetryQueue",
  async (job) => {
    const { to, subject, html, text } = job.data;

    try {
      console.log(`🔁 Retrying email to: ${to}`);



      const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.USER,
          pass: process.env.APP_PASSWORD,
        },
      });

      await transport.sendMail({
        from: { name: "TechHive", address: process.env.USER },
        to,
        subject,
        html,
        text,
      });

      console.log(`✅ Retry successful: ${to}`);
    } catch (error) {
      console.error(`❌ Retry failed for ${to}: ${error.message}`);

      // If retry also fails, move to DLQ
      if (job.attemptsMade >= (job.opts.attempts || 1) - 1) {
        await emailDLQ.add("failedEmail", job.data, {
          removeOnComplete: true,
        });
        console.log(`🪦 Moved to DLQ: ${to}`);
      }

      throw error;
    }
  },
  { connection: bullMQConnection }
);

retryWorker.on("completed", (job) => {
  console.log(`✅ Retry job completed: ${job.id}`);
});

retryWorker.on("failed", (job, err) => {
  console.error(`🔥 Retry job failed: ${job.id}. Error: ${err.message}`);
});
