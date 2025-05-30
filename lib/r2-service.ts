import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_ACCESS_KEY_SECRET!,
  },
});

export async function getSRT(videoId: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `transcripts/${videoId}.srt`,
    });

    const response = await r2Client.send(command);
    if (!response.Body) {
      throw new Error('No content received from R2');
    }
    
    return await response.Body.transformToString();
  } catch (error) {
    console.error('Error fetching SRT from R2:', error);
    throw error;
  }
}
