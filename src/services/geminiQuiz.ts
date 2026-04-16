import {
  GeneratedQuiz,
  GeneratedQuizQuestion,
  QuizQuestionOption,
} from '../types';

const GEMINI_MODEL = 'gemini-1.5-flash';
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
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents,
      generationConfig: {
        responseMimeType: 'application/json',
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
    const errorMessage =
      responseData?.error?.message || 'Gemini request failed.';
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
