import {
  GeneratedQuiz,
  GeneratedQuizQuestion,
  QuizQuestionOption,
} from '../types';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const SYSTEM_INSTRUCTION = `You are a specialized educational AI quiz generator for the StudyMate app.

Your role: Create pedagogical multiple-choice quizzes that test deep understanding, not just recognition or recall.

Difficulty Guidelines:
- Easy: Direct recall questions that test memory of factual information from the text
- Medium: Application questions that require using concepts in new situations
- Hard: Analysis and synthesis questions that require connecting concepts or evaluating scenarios

Rules:
- Base ALL questions ONLY on facts explicitly stated in the provided text
- Questions should require understanding of concepts, not just surface-level memorization
- All 4 options must be plausible - avoid obviously wrong distractors
- Correct answer should be unambiguous
- Explanation must reference the specific source material and explain WHY the answer is correct
- If source text is insufficient for the requested difficulty, prioritize generating what IS possible

Output Format: Valid JSON array with objects containing:
- id: unique question identifier
- question: clear, single-focus question text
- options: array of 4 objects with {id: "A"|"B"|"C"|"D", text: option text}
- correct_answer: the text of the correct option
- explanation: 1-2 sentence explanation of why this answer is correct`;
const MAX_SOURCE_TEXT_LENGTH = 18000;

type QuizDifficulty = 'easy' | 'medium' | 'hard';

interface GenerateQuizInput {
  numQuestions: number;
  difficulty: QuizDifficulty;
  fileName: string;
  sessionId?: string;
  sourceText?: string;
  geminiFileUri?: string;
  mimeType?: string;
}

interface GenerateQuizResponse {
  quiz: GeneratedQuiz;
}

const toOptionId = (index: number) =>
  String.fromCharCode('A'.charCodeAt(0) + index);

const buildPrompt = ({
  difficulty,
  numQuestions,
  sourceText,
  fileName,
}: GenerateQuizInput) => {
  const normalizedSourceText = (sourceText || '').trim();
  const promptBody = normalizedSourceText
    ? normalizedSourceText.slice(0, MAX_SOURCE_TEXT_LENGTH)
    : `the uploaded study material named "${fileName}"`;

  return `Generate a ${difficulty} quiz with ${numQuestions} questions based on: ${promptBody}.
Return a JSON array of objects with: id, question, options (4 choices), correct_answer, and explanation.`;
};

const normalizeOptions = (options: unknown): QuizQuestionOption[] => {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option, index) => {
      if (typeof option === 'string') {
        return {
          id: toOptionId(index),
          text: option.trim(),
        };
      }

      if (option && typeof option === 'object') {
        const record = option as Record<string, unknown>;
        const text =
          typeof record.text === 'string'
            ? record.text
            : typeof record.label === 'string'
              ? record.label
              : '';

        return {
          id:
            typeof record.id === 'string' && record.id.trim()
              ? record.id.trim()
              : toOptionId(index),
          text: text.trim(),
        };
      }

      return {
        id: toOptionId(index),
        text: '',
      };
    })
    .filter((option) => option.text.length > 0)
    .slice(0, 4);
};

const normalizeQuestion = (
  item: unknown,
  fallbackIndex: number,
): GeneratedQuizQuestion | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const record = item as Record<string, unknown>;
  const question =
    typeof record.question === 'string' ? record.question.trim() : '';
  const correctAnswer =
    typeof record.correct_answer === 'string'
      ? record.correct_answer.trim()
      : '';
  const explanation =
    typeof record.explanation === 'string' ? record.explanation.trim() : '';
  const options = normalizeOptions(record.options);
  const matchingOption = options.find(
    (option) =>
      option.id.trim().toLowerCase() === correctAnswer.toLowerCase() ||
      option.text.trim().toLowerCase() === correctAnswer.toLowerCase(),
  );

  if (!question || !correctAnswer || !explanation || options.length !== 4) {
    return null;
  }

  return {
    id:
      typeof record.id === 'string' && record.id.trim()
        ? record.id.trim()
        : `question-${fallbackIndex + 1}`,
    question,
    options,
    correct_answer: matchingOption?.text || correctAnswer,
    explanation,
  };
};

const parseQuizJson = (text: string): GeneratedQuizQuestion[] => {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('Gemini did not return a quiz array.');
  }

  return parsed
    .map((item, index) => normalizeQuestion(item, index))
    .filter((item): item is GeneratedQuizQuestion => item !== null);
};

const getResponseText = (data: unknown): string => {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const response = data as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim() || ''
  );
};

export const generateQuizWithGemini = async (
  input: GenerateQuizInput,
): Promise<GenerateQuizResponse> => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. Set EXPO_PUBLIC_GEMINI_API_KEY to enable quiz generation.',
    );
  }

  if (!input.sourceText?.trim() && !input.geminiFileUri?.trim()) {
    throw new Error(
      'No readable source text or Gemini file URI was available for this document.',
    );
  }

  const prompt = buildPrompt(input);
  const contents = [
    {
      role: 'user',
      parts: [
        ...(input.geminiFileUri?.trim()
          ? [
              {
                fileData: {
                  fileUri: input.geminiFileUri.trim(),
                  mimeType: input.mimeType || 'application/pdf',
                },
              },
            ]
          : []),
        { text: prompt },
      ],
    },
  ];

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
      ],
    }),
  });

  const responseText = await response.text();
  let responseData: unknown = null;
  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      throw new Error('Gemini returned an unreadable response.');
    }
  }

  if (!response.ok) {
    const errorRecord =
      responseData && typeof responseData === 'object'
        ? (responseData as { error?: { message?: string } })
        : null;
    const errorMessage =
      errorRecord?.error?.message || 'Gemini request failed.';
    throw new Error(errorMessage);
  }

  const rawJson = getResponseText(responseData);
  if (!rawJson) {
    throw new Error('Gemini returned an empty response.');
  }

  const questions = parseQuizJson(rawJson);
  if (questions.length < input.numQuestions) {
    throw new Error(
      'Could not generate enough questions from this specific document.',
    );
  }

  const quiz: GeneratedQuiz = {
    id: `quiz-${Date.now()}`,
    title: `${input.fileName} Quiz`,
    fileName: input.fileName,
    difficulty: input.difficulty,
    numQuestions: input.numQuestions,
    sessionId: input.sessionId,
    sourcePreview: input.sourceText?.slice(0, 180),
    createdAt: new Date().toISOString(),
    questions: questions.slice(0, input.numQuestions),
  };

  return { quiz };
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'openai/gpt-4o-mini';

export const generateQuizWithGroq = async (
  input: GenerateQuizInput,
): Promise<{ quiz: GeneratedQuiz }> => {
  const apiKey =
    process.env.GROQ_API_KEY || process.env.EXPO_PUBLIC_GROQ_API_KEY;
  console.log(
    '[Groq] API key exists:',
    !!apiKey,
    'key prefix:',
    apiKey?.slice(0, 10),
  );
  if (!apiKey) {
    throw new Error('Groq API key not configured. Set GROQ_API_KEY in .env');
  }

  const normalizedSourceText = (input.sourceText || '').trim();
  const promptBody = normalizedSourceText
    ? normalizedSourceText.slice(0, MAX_SOURCE_TEXT_LENGTH)
    : `the uploaded study material named "${input.fileName}"`;

  const prompt = `Generate a ${input.difficulty} quiz with ${input.numQuestions} questions based on the following content:
${promptBody}

Return ONLY a valid JSON array (no other text) with exactly ${input.numQuestions} questions. Each question must have:
- id: unique string like "q1", "q2", etc.
- question: string
- options: array of 4 objects with "id" (a, b, c, d) and "text"
- correct_answer: the id of the correct option
- explanation: string explaining why this answer is correct

Example format:
[
  {"id":"q1","question":"What is...?","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],"correct_answer":"a","explanation":"..."}
]`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  const responseText = await response.text();
  let responseData: unknown = null;
  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      throw new Error('Groq returned an invalid response.');
    }
  }

  if (!response.ok) {
    const errorRecord = responseData as { error?: { message?: string } };
    const errorMsg = errorRecord?.error?.message || 'Groq request failed.';
    console.log('[Groq] Error response:', response.status, errorMsg);
    throw new Error(errorMsg);
  }

  const groqData = responseData as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const rawJson = groqData.choices?.[0]?.message?.content || '';
  if (!rawJson) {
    throw new Error('Groq returned an empty response.');
  }

  // Clean up the JSON (remove markdown code blocks if any)
  const cleanedJson = rawJson.replace(/```json?/g, '').trim();

  const questions = parseQuizJson(cleanedJson);
  if (questions.length < input.numQuestions) {
    throw new Error('Could not generate enough questions from this document.');
  }

  const quiz: GeneratedQuiz = {
    id: `quiz-${Date.now()}`,
    title: `${input.fileName} Quiz`,
    fileName: input.fileName,
    difficulty: input.difficulty,
    numQuestions: input.numQuestions,
    sessionId: input.sessionId,
    sourcePreview: input.sourceText?.slice(0, 180),
    createdAt: new Date().toISOString(),
    questions: questions.slice(0, input.numQuestions),
  };

  return { quiz };
};

export const generateQuizWithOpenRouter = async (
  input: GenerateQuizInput,
): Promise<{ quiz: GeneratedQuiz }> => {
  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  console.log(
    '[OpenRouter] API key exists:',
    !!apiKey,
    'key prefix:',
    apiKey?.slice(0, 10),
  );
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const normalizedSourceText = (input.sourceText || '').trim();
  const promptBody = normalizedSourceText
    ? normalizedSourceText.slice(0, MAX_SOURCE_TEXT_LENGTH)
    : `the uploaded study material named "${input.fileName}"`;

  const prompt = `Generate a ${input.difficulty} quiz with ${input.numQuestions} questions based on the following content:
${promptBody}

Return ONLY a valid JSON array with ${input.numQuestions} questions. Each question: id, question, options (4 with id/text), correct_answer, explanation.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://studymate.app',
      'X-Title': 'StudyMate',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  const responseText = await response.text();
  let responseData: unknown = null;
  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      throw new Error('OpenRouter returned an invalid response.');
    }
  }

  if (!response.ok) {
    const errorRecord = responseData as { error?: { message?: string } };
    const errorMsg =
      errorRecord?.error?.message || 'OpenRouter request failed.';
    console.log('[OpenRouter] Error:', response.status, errorMsg);
    throw new Error(errorMsg);
  }

  const orData = responseData as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawJson = orData.choices?.[0]?.message?.content || '';
  if (!rawJson) throw new Error('OpenRouter returned empty response.');

  const cleanedJson = rawJson.replace(/```json?/g, '').trim();
  const questions = parseQuizJson(cleanedJson);
  if (questions.length < input.numQuestions)
    throw new Error('Could not generate enough questions.');

  const quiz: GeneratedQuiz = {
    id: `quiz-${Date.now()}`,
    title: `${input.fileName} Quiz`,
    fileName: input.fileName,
    difficulty: input.difficulty,
    numQuestions: input.numQuestions,
    sessionId: input.sessionId,
    sourcePreview: input.sourceText?.slice(0, 180),
    createdAt: new Date().toISOString(),
    questions: questions.slice(0, input.numQuestions),
  };
  return { quiz };
};

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

export const generateQuizWithOpenAI = async (
  input: GenerateQuizInput,
): Promise<{ quiz: GeneratedQuiz }> => {
  const apiKey =
    process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  console.log(
    '[OpenAI] API key exists:',
    !!apiKey,
    'key prefix:',
    apiKey?.slice(0, 10),
  );
  if (!apiKey || apiKey === 'sk-your-openai-key-here') {
    throw new Error(
      'OpenAI API key not configured. Set EXPO_PUBLIC_OPENAI_API_KEY in .env',
    );
  }

  const normalizedSourceText = (input.sourceText || '').trim();
  const promptBody = normalizedSourceText
    ? normalizedSourceText.slice(0, MAX_SOURCE_TEXT_LENGTH)
    : `the uploaded study material named "${input.fileName}"`;

  const prompt = `Generate a ${input.difficulty} quiz with ${input.numQuestions} questions based on the following content:
${promptBody}

Return ONLY a valid JSON array (no other text) with exactly ${input.numQuestions} questions. Each question must have:
- id: unique string like "q1", "q2", etc.
- question: string
- options: array of 4 objects with "id" (a, b, c, d) and "text"
- correct_answer: the id of the correct option
- explanation: string explaining why this answer is correct

Example format:
[
  {"id":"q1","question":"What is...?","options":[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],"correct_answer":"a","explanation":"..."}
]`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  const responseText = await response.text();
  let responseData: unknown = null;
  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      throw new Error('OpenAI returned an invalid response.');
    }
  }

  if (!response.ok) {
    const errorRecord = responseData as { error?: { message?: string } };
    throw new Error(errorRecord?.error?.message || 'OpenAI request failed.');
  }

  const openaiData = responseData as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const rawJson = openaiData.choices?.[0]?.message?.content || '';
  if (!rawJson) {
    throw new Error('OpenAI returned an empty response.');
  }

  // Clean up the JSON (remove markdown code blocks if any)
  const cleanedJson = rawJson.replace(/```json?/g, '').trim();

  const questions = parseQuizJson(cleanedJson);
  if (questions.length < input.numQuestions) {
    throw new Error('Could not generate enough questions from this document.');
  }

  const quiz: GeneratedQuiz = {
    id: `quiz-${Date.now()}`,
    title: `${input.fileName} Quiz`,
    fileName: input.fileName,
    difficulty: input.difficulty,
    numQuestions: input.numQuestions,
    sessionId: input.sessionId,
    sourcePreview: input.sourceText?.slice(0, 180),
    createdAt: new Date().toISOString(),
    questions: questions.slice(0, input.numQuestions),
  };

  return { quiz };
};
