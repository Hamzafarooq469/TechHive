
const { emailQueue, emailRetryQueue, emailDLQ } = require("../queues/emailQueues");

const addEmailJob = async ({
  to,
  subject,
  html,
  text,
  jobType = "default",
  queue = "emailQueue", 
}) => {
  let options = {
    priority: 3,
    attempts: 3,
    timeout: 3000,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
  };

  switch (jobType) {
    case "order":
      options = {
        priority: 1,
        attempts: 3,
        timeout: 3000,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
      };
      break;

    case "signup":
      options = {
        priority: 2,
        attempts: 3,
        timeout: 3000,
        backoff: { type: "fixed", delay: 500 },
        removeOnComplete: true,
        removeOnFail: false,
      };
      break;

    default:
      break;
  }

  // Pick the correct queue based on the name
  let selectedQueue;
  switch (queue) {
    case "emailRetryQueue":
      selectedQueue = emailRetryQueue;
      break;
    case "emailDLQ":
      selectedQueue = emailDLQ;
      break;
    case "emailQueue":
    default:
      selectedQueue = emailQueue;
      break;
  }

  // Add the job to the selected queue
  const job = await selectedQueue.add(queue, {
    to,
    subject,
    html,
    text,
    jobType,
  }, options);

  console.log(`\n🎯 JOB CREATED - ID: ${job.id}`);
  console.log(`   Queue: ${queue}`);
  console.log(`   To: ${to}`);
  console.log(`   JobType: ${jobType}`);
  console.log(`   Priority: ${options.priority}`);
  console.log(`   Attempts: ${options.attempts}`);
  
  return job;
};

module.exports = addEmailJob;
