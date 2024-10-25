// const openai = new OpenAI({
//   apiKey: apiKey,
//   dangerouslyAllowBrowser: true,
// });


// const generateQuestion = async (problemStatement: string, stage: string): Promise<QuestionResponse | null> => {
//   const prompt = `
//     You are an expert software engineering interviewer. Given the following problem statement, generate a single multiple-choice question that tests the interviewee's understanding of the problem based on the "${stage}" step of the UMPIRE method.

//     The question should:
//     1. Focus on the ${stage} aspect of the problem.
//     2. Help the interviewee think about ${stage}-related concepts or challenges.
//     3. Be relevant to the given problem and not introduce new concepts.

//     Problem Statement:
//     ${problemStatement}

//     Provide your response in the following JSON format:
//     {
//       "question": "The multiple-choice question text",
//       "options": [
//         {"option": "First option text", "isCorrect": boolean},
//         {"option": "Second option text", "isCorrect": boolean},
//         {"option": "Third option text", "isCorrect": boolean}
//       ],
//       "multiSelect": false
//     }
//   `;

  // const params: OpenAI.Chat.ChatCompletionCreateParams = {
  //   messages: [{ role: "user", content: prompt }],
  //   model: "gpt-4o-mini",
  //   response_format: { type: "json_object" },
  // };

  // try {
  //   const chatCompletion = await openai.chat.completions.create(params);
  //   const rawResponse = chatCompletion.choices[0]?.message?.content;
  //   console.log(`OpenAI response: ${rawResponse}`);

  //   if (rawResponse) {
  //     const jsonResponse = JSON.parse(rawResponse);
  //     console.log(`Parsed response: ${JSON.stringify(jsonResponse)}`);

  //     if (jsonResponse.question && Array.isArray(jsonResponse.options) && jsonResponse.multiSelect !== undefined) {
  //       return jsonResponse as QuestionResponse;
  //     }
  //   }
    
  //   console.error("Invalid response format from OpenAI");
  //   return null;
  // } catch (error) {
  //   console.error("Error calling OpenAI API:", error);
  //   return null;
  // }