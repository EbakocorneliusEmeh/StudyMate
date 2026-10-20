import { getDocumentChunks, getDocumentStatus } from '../api/documents';
import { UploadedFile } from '../api/upload';
import { DocumentSourceRecord } from '../types';
import { upsertDocumentSource } from './storage';

const TEXT_MIME_TYPES = new Set(['text/plain', 'text/markdown']);

const readLocalTextFile = async (uri: string): Promise<string | undefined> => {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      return undefined;
    }

    const text = await response.text();
    return text.trim() ? text : undefined;
  } catch (error) {
    console.warn('Unable to read local text source:', error);
    return undefined;
  }
};

export const persistUploadedDocumentSource = async (params: {
  uploadedFile: UploadedFile;
  sessionId: string;
  fileId?: string;
  localUri?: string;
}) => {
  const { uploadedFile, sessionId, fileId, localUri } = params;

  const sourceText =
    uploadedFile.source_text ||
    (localUri && TEXT_MIME_TYPES.has(uploadedFile.file_type)
      ? await readLocalTextFile(localUri)
      : undefined);

  const geminiFileUri =
    uploadedFile.gemini_file_uri ||
    (uploadedFile.file_url.startsWith('gs://') ||
    uploadedFile.file_url.includes('generativelanguage.googleapis.com')
      ? uploadedFile.file_url
      : undefined);

  const now = new Date().toISOString();
  const sourceRecord: DocumentSourceRecord = {
    id: `${sessionId}:${uploadedFile.file_name}`,
    sessionId,
    fileId,
    documentId: uploadedFile.document_id,
    fileName: uploadedFile.file_name,
    fileUrl: uploadedFile.file_url,
    sourceText,
    geminiFileUri,
    mimeType: uploadedFile.file_type,
    createdAt: now,
    updatedAt: now,
  };

  await upsertDocumentSource(sourceRecord);
  return sourceRecord;
};

export const hydrateDocumentSourceFromBackend = async (params: {
  documentId: string;
  sessionId: string;
  fileName: string;
  fileId?: string;
  fileUrl?: string;
}): Promise<DocumentSourceRecord | null> => {
  const document = await getDocumentStatus(params.documentId);

  // Fetch extracted text chunks
  let sourceText: string | undefined;
  try {
    const chunksData = await getDocumentChunks(params.documentId);
    if (chunksData.chunks && chunksData.chunks.length > 0) {
      // Combine all chunks into a single text
      sourceText = chunksData.chunks.map((c) => c.content).join('\n\n');
    }
  } catch (err) {
    console.warn('Failed to fetch document chunks:', err);
  }

  const sourceRecord: DocumentSourceRecord = {
    id: `${params.sessionId}:${params.fileName}`,
    sessionId: params.sessionId,
    fileId: params.fileId,
    documentId: params.documentId,
    fileName: document.file_name || params.fileName,
    fileUrl: document.file_url || params.fileUrl,
    sourceText: sourceText,
    geminiFileUri: document.gemini_file_uri || undefined,
    mimeType: document.file_type,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
  };

  await upsertDocumentSource(sourceRecord);
  return sourceRecord;
};

export const waitForDocumentSource = async (params: {
  documentId: string;
  sessionId: string;
  fileName: string;
  fileId?: string;
  fileUrl?: string;
  attempts?: number;
  intervalMs?: number;
}) => {
  const attempts = params.attempts ?? 6;
  const intervalMs = params.intervalMs ?? 1500;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const document = await getDocumentStatus(params.documentId);

    if (document.status === 'ready') {
      return hydrateDocumentSourceFromBackend(params);
    }

    if (document.status === 'failed') {
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
};
