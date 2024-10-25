import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import type { NextApiRequest, NextApiResponse } from 'next';


const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    sessionToken: process.env.AWS_SESSION_TOKEN || '',
  }
});
const bucketName = process.env.AWS_BUCKET_NAME;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // console.log("API is being called");
  if (req.method === 'GET') {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'questions/',
        Delimiter: '/',
      });
      const response = await s3Client.send(command);
      // console.log('S3 response:', JSON.stringify(response, null, 2));
      const questionFolders = response.CommonPrefixes?.map(prefix => {
        // Extract just the folder name, removing 'questions/' prefix
        const folderName = prefix.Prefix?.replace('questions/', '').replace('/', '');
        return folderName;
      }).filter(Boolean) || [];
      res.status(200).json(questionFolders);
    } catch (error) {
      console.error('Error reading questions from S3:', error);
      res.status(500).json({ error: 'Failed to read questions from S3' });
    }
  } else if (req.method === 'POST') {
    try {
      const { folder } = req.body;
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: `questions/${folder}/README.md`,
      });
      const response = await s3Client.send(command);
      const markdownContent = await response.Body?.transformToString();
      res.status(200).json({ content: markdownContent });
    } catch (error) {
      console.error('Error reading markdown file from S3:', error);
      res.status(500).json({ error: 'Failed to read markdown file from S3' });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}