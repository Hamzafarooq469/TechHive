
// worker/emailWorker.js
const { Worker } = require("bullmq");
const nodemailer = require("nodemailer");
const { bullMQConnection } = require("../../services/redisClient");
const { emailRetryQueue } = require("../queues/emailQueues");
require("dotenv").config({ path: "./config/.env" });

console.log("🚀 Email Worker started and waiting for jobs...");

const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { to, subject, html, text, jobType } = job.data;
    const startTime = Date.now();

    console.log("\n🔄 PROCESSING EMAIL JOB");
    console.log("══════════════════════════════════════");
    console.log(`📬 Job ID: ${job.id}`);
    console.log(`📧 To: ${to}`);
    console.log(`📋 Subject: ${subject}`);
    console.log(`🏷️  JobType: ${jobType || 'default'}`);
    console.log(`🔢 Attempt: ${job.attemptsMade + 1}/${job.opts.attempts || 3}`);
    console.log(`🕐 Started: ${new Date().toLocaleString()}`);
    console.log("══════════════════════════════════════");

    try {
      console.log("🔌 Creating email transport...");


      const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.USER,
          pass: process.env.APP_PASSWORD,
        },
      });

      console.log("📤 Sending email...");
      const info = await transport.sendMail({
        from: { name: "TechHive", address: process.env.USER },
        to,
        subject,
        html,
        text,
      });

      const duration = Date.now() - startTime;
      console.log("\n✅ EMAIL SENT SUCCESSFULLY!");
      console.log("══════════════════════════════════════");
      console.log(`📬 Job ID: ${job.id}`);
      console.log(`📧 To: ${to}`);
      console.log(`📨 Message ID: ${info.messageId}`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`🕐 Completed: ${new Date().toLocaleString()}`);
      console.log("══════════════════════════════════════\n");
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error("\n❌ EMAIL SENDING FAILED");
      console.error("══════════════════════════════════════");
      console.error(`📬 Job ID: ${job.id}`);
      console.error(`📧 To: ${to}`);
      console.error(`❗ Error: ${error.message}`);
      console.error(`🔢 Attempt: ${job.attemptsMade + 1}/${job.opts.attempts || 3}`);
      console.error(`⏱️  Duration: ${duration}ms`);
      console.error(`🕐 Failed at: ${new Date().toLocaleString()}`);
      console.error("══════════════════════════════════════");

      // If final attempt, move to retry queue
      if (job.attemptsMade >= (job.opts.attempts || 1) - 1) {
        await emailRetryQueue.add("retryEmail", job.data, {
          attempts: 2,
          backoff: { type: "fixed", delay: 5000 },
          removeOnComplete: true,
        });
        console.log(`🔁 MOVED TO RETRY QUEUE: ${to}\n`);
      } else {
        console.log(`🔄 Will retry... (${job.opts.attempts - job.attemptsMade - 1} attempts left)\n`);
      }

      throw error;
    }
  },
  {
    connection: bullMQConnection,
    concurrency: 5,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} completed for: ${job.data.to}`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`🔥 Job ${job.id} failed for: ${job.data.to}. Error: ${err.message}`);
});

process.on("SIGINT", async () => {
  console.log("🛑 Gracefully shutting down email worker...");
  await emailWorker.close();
  process.exit(0);
});
