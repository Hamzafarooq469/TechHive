// queues/emailQueues.js
const { Queue } = require("bullmq");
const { bullMQConnection } = require("../../services/redisClient");

const emailQueue = new Queue("emailQueue", { connection: bullMQConnection });
const emailRetryQueue = new Queue("emailRetryQueue", { connection: bullMQConnection });
const emailDLQ = new Queue("emailDLQ", { connection: bullMQConnection });

module.exports = {
  emailQueue,
  emailRetryQueue,
  emailDLQ,
};
