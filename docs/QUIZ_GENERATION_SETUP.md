# Quiz Generation Setup

This checklist is the safest way to bring the new AI quiz flow online.

## 1. Apply the database migration

Run the SQL in:

- `/home/tony-clex/Desktop/study-M/study-mate/study-mate/src/database/migrations/2026-04-07_documents_processing.sql`

You can paste it into the Supabase SQL Editor and run it once.

The `documents` table must end up with:

- `status`
- `source_text`
- `gemini_file_uri`
- `error_message`
- `updated_at`

## 2. Verify backend environment

In:

- `/home/tony-clex/Desktop/study-M/study-mate/study-mate/.env`

make sure these exist and are valid:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GROQ_API_KEY` if you expect Groq fallback for PDF extraction

## 3. Verify mobile environment

In:

- `/home/tony-clex/Desktop/study-M/StudyMate/.env`

make sure this exists:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

Restart Expo after changing this file.

## 4. Restart the backend

From:

- `/home/tony-clex/Desktop/study-M/study-mate/study-mate`

restart the Nest server so the new `documents` endpoint is available.

## 5. Upload a known-good text file first

Use this file first:

- `/home/tony-clex/Desktop/study-M/StudyMate/docs/sample-study-note.txt`

This is the easiest possible success case because plain text should become quiz-ready immediately.

## 6. Confirm `/api/upload` returns document processing fields

After upload, the response should include:

- `document_id`
- `status`
- `source_text`
- `gemini_file_uri`
- `error_message`

Expected status values:

- `ready`: extraction succeeded
- `processing`: reserved for async/background flow
- `failed`: extraction failed

## 7. Confirm document status directly

Call:

- `GET /api/documents/:documentId`

You should see:

- `status: "ready"`
- `source_text` populated for text/PDF/DOCX files

## 8. Re-upload older documents

Files uploaded before the new processing contract may not have `source_text` or `document_id` stored properly. Re-upload them after the migration is live.

## 9. Test in this order

1. Upload `sample-study-note.txt`
2. Open the file from the session page
3. Tap `Generate Quiz`
4. Confirm the quiz is created
5. Then test PDF
6. Then test DOCX

## 10. If generation still fails

Check these in order:

- backend upload response from `/api/upload`
- `GET /api/documents/:documentId`
- backend logs during extraction
- whether the selected file was uploaded after the migration

## Manual work still required

These steps must be done by you because they affect live services:

- apply the Supabase SQL migration
- restart the Nest backend
- restart Expo after env updates
- upload a fresh test file
