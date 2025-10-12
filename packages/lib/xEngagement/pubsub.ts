/**
 * GCP Pub/Sub utilities for X Engagement jobs
 */

import { PubSub } from "@google-cloud/pubsub";

const TOPIC_NAME = "x-engagement-jobs";

let pubsubClient: PubSub | null = null;

/**
 * Get or create Pub/Sub client
 */
export function getPubSubClient(): PubSub {
  if (!pubsubClient) {
    // Use credentials from environment
    const credentials = process.env.GCP_STORAGE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.GCP_STORAGE_SERVICE_ACCOUNT)
      : undefined;

    pubsubClient = new PubSub({
      projectId: credentials?.project_id,
      credentials,
    });
  }
  return pubsubClient;
}

/**
 * Publish a job to the queue
 */
export async function publishJob(jobId: string, userId: number, delaySeconds: number = 0) {
  const pubsub = getPubSubClient();
  const topic = pubsub.topic(TOPIC_NAME);

  const data = JSON.stringify({ jobId, userId, timestamp: Date.now() });
  const messageId = await topic.publishMessage({
    data: Buffer.from(data),
    attributes: {
      jobId,
      userId: userId.toString(),
    },
  });

  console.log(`Published job ${jobId} with message ID: ${messageId}`);
  return messageId;
}

/**
 * Create topic if it doesn't exist
 */
export async function ensureTopic() {
  const pubsub = getPubSubClient();
  const topicName = `projects/${pubsub.projectId}/topics/${TOPIC_NAME}`;

  try {
    const [exists] = await pubsub.topic(topicName).exists();
    if (!exists) {
      await pubsub.createTopic(topicName);
      console.log(`Created topic: ${topicName}`);
    }
  } catch (error) {
    console.error("Error ensuring topic:", error);
  }
}
