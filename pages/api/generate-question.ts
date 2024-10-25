import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import type { NextApiRequest, NextApiResponse } from "next";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import axios from "axios";

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    sessionToken: process.env.AWS_SESSION_TOKEN || "",
  },
});
const secretName = "UmpireRunSecrets";
const SAVE_QUESTIONS_LAMBDA_URL = "https://7qt6bbt7mfkmtbpxcfyq3yo4du0vnpmi.lambda-url.us-east-1.on.aws/";
async function getApiKey(): Promise<string> {
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: "AWSCURRENT",
      })
    );

    if (response.SecretString) {
      const secret = JSON.parse(response.SecretString);
      console.log(`Secret: ${secret}`);
      return secret.OPEN_AI_KEY;
    } else {
      throw new Error("Secret string is empty");
    }
  } catch (error) {
    console.error("Error retrieving secret:", error);
    throw error;
  }
}

interface Option {
  option: string;
  isCorrect: boolean;
}

interface QuestionResponse {
  question: string;
  options: { option: string; isCorrect: boolean }[];
  explanation?: string;
}

const generateQuestions = async (
  problemFile: string,
  stage: string,
  count: number
): Promise<QuestionResponse[]> => {
  console.log("Generating questions for stage:", stage);
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      sessionToken: process.env.AWS_SESSION_TOKEN || "",
    },
  });
  const bucketName = process.env.AWS_BUCKET_NAME;

  let problemStatement: string;
  let solutionContent: string;

  try {
    // Fetch README.md
    const readmeCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: `questions/${problemFile}/README.md`,
    });
    const readmeResponse = await s3Client.send(readmeCommand);
    problemStatement = (await readmeResponse.Body?.transformToString()) || "";

    // Fetch .cpp solution file
    const cppCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: `questions/${problemFile}/${problemFile}.cpp`,
    });
    const cppResponse = await s3Client.send(cppCommand);
    solutionContent = await cppResponse.Body?.transformToString() || "";

  } catch (error) {
    console.error(`Error reading problem files from S3: ${error}`);
    return [];
  }

  let template: string;
  if (stage === "Implement") {
    template = `
      You are an expert software engineering interviewer. Given the following problem statement and C++ implementation, generate {count} multiple-choice questions that test the interviewee's in-depth understanding of the implementation for this problem.

      The questions should:
      1. Focus on specific code snippets or implementation details from the C++ solution.
      2. Test understanding of algorithm logic, edge cases, or optimizations used in the solution.
      3. Include questions about completing or fixing code snippets related to the problem.
      4. Be relevant to the given problem and not introduce unrelated concepts.

      Problem Statement:
      {problemStatement}

      C++ Implementation:
      {solutionContent}

      Provide your response as an array of {count} questions in the following JSON format:
      [
        {{
          "question": "Given the code snippet:\\n\\n\`\`\`cpp\\n# Insert relevant code snippet here\\n\`\`\`\\n\\nWhat is the correct implementation of [specific function or logic]?",
          "options": [
            {{"option": "Code option 1", "isCorrect": boolean}},
            {{"option": "Code option 2", "isCorrect": boolean}},
            {{"option": "Code option 3", "isCorrect": boolean}},
            {{"option": "Code option 4", "isCorrect": boolean}}
          ],
          "multiSelect": false
        }},
        // ... (repeat for {count} questions)
      ]
    `;
  } else {
    // Use a modified template for other stages
    template = `
      You are an expert software engineering interviewer. Given the following problem statement and C++ implementation, generate {count} multiple-choice questions that test the interviewee's understanding of the problem based on the "{stage}" step of the UMPIRE method.

      The questions should:
      1. Focus on the {stage} aspect of the problem.
      2. Help the interviewee think about {stage}-related concepts or challenges.
      3. Be relevant to the given problem and not introduce new concepts.
      4. Reference the C++ implementation where appropriate.

      Problem Statement:
      {problemStatement}

      C++ Implementation:
      {solutionContent}

      Provide your response as an array of {count} questions in the following JSON format:
      [
        {{
          "question": "The multiple-choice question text",
          "options": [
            {{"option": "First option text", "isCorrect": boolean}},
            {{"option": "Second option text", "isCorrect": boolean}},
            {{"option": "Third option text", "isCorrect": boolean}},
            {{"option": "Fourth option text", "isCorrect": boolean}}
          ],
          "multiSelect": false
        }},
        // ... (repeat for {count} questions)
      ]
    `;
  }

  const apiKey = await getApiKey();
  const model = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: "gpt-4o-mini",
    temperature: 0,
  });

  const prompt = PromptTemplate.fromTemplate(template);
  const outputParser = new JsonOutputParser();

  const chain = prompt.pipe(model).pipe(outputParser);
  try {
    const response = await chain.invoke({
      problemStatement,
      solutionContent,
      stage,
      count: count.toString(),
    });

    if (Array.isArray(response) && response.length === count) {
      // Save questions to DynamoDB via Lambda function
      const lambdaUrl = SAVE_QUESTIONS_LAMBDA_URL;
      if (lambdaUrl) {
        await axios.post(lambdaUrl, {
          problemFile,
          stage,
          questions: response,
        });
      }
      return response as QuestionResponse[];
    }

    console.error("Invalid response format from LangChain");
    return [];
  } catch (error) {
    console.error("Error calling LangChain:", error);
    return [];
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { problemFile, stage, count } = req.body;
    try {
      const response = await generateQuestions(problemFile, stage, count);
      if (response.length > 0) {
        res.status(200).json(response);
      } else {
        res.status(500).json({ error: "Failed to generate questions" });
      }
    } catch (error) {
      console.error("Failed to generate questions", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}


