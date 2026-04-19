import {
  GeneratedFlashcard,
  FlashcardDeck,
  FlashcardChatMessage,
} from '../types';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_SOURCE_TEXT_LENGTH = 18000;

const FLASHCARD_SYSTEM_PROMPT = `You are an Expert Academic Strategist & Flashcard Creator.

Your task is to convert the user's uploaded document/image/text into high-quality flashcards.

Rules for Card Generation:
1. Atomic Design: Each card must contain only ONE discrete idea.
2. Front/Back Format: Generate cards in a JSON-ready format with 'front' and 'back' keys.
3. Image/PDF Processing: Extract text accurately. If the content is a diagram, describe the process and create cards based on the logic of that diagram.
4. Active Recall: Phrase the 'front' of the card as a question or a 'fill-in-the-blank' (Cloze) rather than just a keyword.
5. Quality Control: Do not generate more than 15 cards at a time unless requested. Focus on the most important concepts.

Output Format: Valid JSON array with objects containing:
- id: unique card identifier (like "card-1", "card-2", etc.)
- front: the question or prompt (active recall format)
- back: the answer or explanation

Interaction Mode: 
After generating cards, stay 'active.' If the user says "Explain card #3," provide a 2-paragraph breakdown using an analogy.
If the user asks for "Simpler explanations" or "More examples", regenerate specific cards with the requested modifications.`;

const CHAT_SYSTEM_PROMPT = `You are an Expert Academic Strategist helping the user understand their flashcard deck.

When the user asks about specific cards (e.g., "Explain card #3"):
- Provide a 2-paragraph breakdown using an analogy
- Connect the concept to real-world examples
- Keep explanations concise but thorough

When the user asks for modifications:
- "Simpler explanations": Rewrite the card with simpler language
- "More examples": Add concrete examples to the card's answer
- "Make these harder": Add more challenging phrasing or edge cases
- "Translate to [language]": Translate the cards to the requested language

Always reference the specific card numbers when answering.`;

interface GenerateFlashcardsInput {
  numCards: number;
  fileName: string;
  sessionId?: string;
  sourceText?: string;
  geminiFileUri?: string;
  mimeType?: string;
}

interface FlashcardGenerationResponse {
  deck: FlashcardDeck;
}

const toCardId = (index: number) => `card-${index + 1}`;

const buildGenerationPrompt = ({
  numCards,
  sourceText,
  fileName,
}: GenerateFlashcardsInput) => {
  const promptBody = sourceText
    ? sourceText.trim().slice(0, MAX_SOURCE_TEXT_LENGTH)
    : `the uploaded study material named "${fileName}"`;

  return `Generate exactly ${numCards} flashcards based on the following content:
${promptBody}

Return ONLY a valid JSON array (no other text) with exactly ${numCards} cards. Each card must have:
- id: unique string like "card-1", "card-2", etc.
- front: string - phrase as a question or fill-in-the-blank (active recall)
- back: string - the answer or explanation

Focus on the most important concepts and ensure each card tests one discrete idea.`;
};

const normalizeFlashcard = (
  item: unknown,
  fallbackIndex: number,
): GeneratedFlashcard | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const record = item as Record<string, unknown>;
  const front = typeof record.front === 'string' ? record.front.trim() : '';
  const back = typeof record.back === 'string' ? record.back.trim() : '';

  if (!front || !back) {
    return null;
  }

  return {
    id:
      typeof record.id === 'string'
        ? record.id.trim()
        : toCardId(fallbackIndex),
    front,
    back,
  };
};

const parseFlashcardsJson = (text: string): GeneratedFlashcard[] => {
  const cleanedText = text.replace(/```json?/g, '').trim();
  const parsed = JSON.parse(cleanedText);

  if (!Array.isArray(parsed)) {
    throw new Error('Gemini did not return a flashcards array.');
  }

  return parsed
    .map((item, index) => normalizeFlashcard(item, index))
    .filter((item): item is GeneratedFlashcard => item !== null);
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

export const generateFlashcardsWithGemini = async (
  input: GenerateFlashcardsInput,
  onProgress?: (progress: number) => void,
): Promise<FlashcardGenerationResponse> => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. Set EXPO_PUBLIC_GEMINI_API_KEY to enable flashcard generation.',
    );
  }

  if (!input.sourceText?.trim() && !input.geminiFileUri?.trim()) {
    throw new Error(
      'No readable source text or Gemini file URI was available for this document.',
    );
  }

  onProgress?.(10);

  const prompt = buildGenerationPrompt(input);
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

  onProgress?.(30);

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        role: 'system',
        parts: [{ text: FLASHCARD_SYSTEM_PROMPT }],
      },
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

  onProgress?.(70);

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

  onProgress?.(85);

  const cards = parseFlashcardsJson(rawJson);
  if (cards.length === 0) {
    throw new Error('Could not generate any flashcards from this document.');
  }

  onProgress?.(100);

  const deck: FlashcardDeck = {
    id: `deck-${Date.now()}`,
    title: `${input.fileName} Flashcards`,
    sourceFileName: input.fileName,
    sourceText: input.sourceText,
    geminiFileUri: input.geminiFileUri,
    mimeType: input.mimeType,
    cardCount: cards.length,
    createdAt: new Date().toISOString(),
    cards: cards.slice(0, input.numCards),
  };

  return { deck };
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

export const generateFlashcardsWithGroq = async (
  input: GenerateFlashcardsInput,
  onProgress?: (progress: number) => void,
): Promise<FlashcardGenerationResponse> => {
  const apiKey =
    process.env.GROQ_API_KEY || process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Groq API key not configured. Set GROQ_API_KEY in .env');
  }

  if (!input.sourceText?.trim()) {
    throw new Error('No source text was available for this document.');
  }

  onProgress?.(10);

  const promptBody = input.sourceText.trim().slice(0, MAX_SOURCE_TEXT_LENGTH);
  const prompt = `Generate exactly ${input.numCards} flashcards based on the following content:
${promptBody}

Return ONLY a valid JSON array (no other text) with exactly ${input.numCards} cards. Each card must have:
- id: unique string like "card-1", "card-2", etc.
- front: string - phrase as a question or fill-in-the-blank (active recall)
- back: string - the answer or explanation

Follow the rules:
1. Atomic Design: Each card contains only ONE discrete idea
2. Front/Back Format: JSON with 'front' and 'back' keys
3. Active Recall: Phrase as question or fill-in-the-blank
4. Quality: Focus on important concepts (max 15 unless requested)`;

  onProgress?.(30);

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: FLASHCARD_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  onProgress?.(70);

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
    throw new Error(errorRecord?.error?.message || 'Groq request failed.');
  }

  const groqData = responseData as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const rawJson = groqData.choices?.[0]?.message?.content || '';
  if (!rawJson) {
    throw new Error('Groq returned an empty response.');
  }

  onProgress?.(85);

  const cards = parseFlashcardsJson(rawJson);
  if (cards.length === 0) {
    throw new Error('Could not generate flashcards from this document.');
  }

  onProgress?.(100);

  const deck: FlashcardDeck = {
    id: `deck-${Date.now()}`,
    title: `${input.fileName} Flashcards`,
    sourceFileName: input.fileName,
    sourceText: input.sourceText,
    mimeType: input.mimeType,
    cardCount: cards.length,
    createdAt: new Date().toISOString(),
    cards: cards.slice(0, input.numCards),
  };

  return { deck };
};

export const chatAboutFlashcards = async (
  message: string,
  deck: FlashcardDeck,
  chatHistory: FlashcardChatMessage[],
): Promise<{ response: string }> => {
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const cardsSummary = deck.cards
    .map(
      (card, index) => `Card #${index + 1}:\nQ: ${card.front}\nA: ${card.back}`,
    )
    .join('\n\n');

  const contextMessage = `You are helping the user understand their flashcard deck "${deck.title}".

Here are the cards in the deck:
${cardsSummary}

Current conversation:`;

  const conversationHistory = chatHistory
    .map(
      (msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`,
    )
    .join('\n');

  const fullPrompt = `${contextMessage}
${conversationHistory}
User: ${message}

Provide a helpful response following the guidelines:
- If asking about specific cards, reference them by number
- Use analogies for explanations
- Keep responses concise but thorough`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        { role: 'user', content: fullPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Chat request failed.');
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content || '';
  return { response: content };
};

export const regenerateCardWithModification = async (
  cardId: string,
  modification: 'simpler' | 'harder' | 'examples',
  deck: FlashcardDeck,
): Promise<GeneratedFlashcard> => {
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const card = deck.cards.find((c) => c.id === cardId);
  if (!card) {
    throw new Error('Card not found');
  }

  const modificationPrompt = {
    simpler:
      'Rewrite this card with simpler language that a beginner can understand. Keep the same core concept.',
    harder:
      'Rewrite this card with more challenging phrasing or add edge cases to test deeper understanding.',
    examples: 'Add concrete examples to the answer portion of this card.',
  }[modification];

  const prompt = `Original card:
Q: ${card.front}
A: ${card.back}

Request: ${modificationPrompt}

Return ONLY a valid JSON object (no other text) with:
- id: "${cardId}"
- front: the updated question
- back: the updated answer`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: FLASHCARD_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Regeneration request failed.');
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const rawJson = data.choices?.[0]?.message?.content || '';
  const cleanedJson = rawJson.replace(/```json?/g, '').trim();
  const updatedCard = JSON.parse(cleanedJson) as GeneratedFlashcard;

  return {
    id: cardId,
    front: updatedCard.front || card.front,
    back: updatedCard.back || card.back,
  };
};
