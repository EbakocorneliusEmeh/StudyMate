# Two-Step Upload Process Implementation

## Overview

The frontend now implements a **two-step upload process** that matches the backend architecture:

1. **Step 1: Upload the file** to `/api/upload`
2. **Step 2: Link the file to a session** via `/session/files`

## Implementation Details

### File: `components/FileUploader.tsx`

#### Changes Made

1. **Added import for `linkFileToSession`**:

   ```typescript
   import { linkFileToSession, SessionFile } from '../src/api/sessions';
   ```

2. **Updated `handleUpload` function** to implement the two-step process:

   ```typescript
   const handleUpload = async () => {
     // ... validation code ...

     // Step 1: Upload the file to /api/upload
     const uploadResult = await uploadFile(
       {
         uri: selectedFile.uri,
         name: selectedFile.name,
         type: selectedFile.type,
       },
       `session-${selectedSessionId}`,
     );

     // Step 2: Link the file to the session
     const linkedFile = await linkFileToSession(
       selectedSessionId,
       uploadResult.file_url,
       uploadResult.file_name,
       uploadResult.file_type,
       uploadResult.file_size,
     );

     // ... success handling ...
   };
   ```

### API Functions Used

#### Step 1: `uploadFile` (from `src/api/upload.ts`)

- **Endpoint**: `POST /api/upload`
- **Content-Type**: `multipart/form-data`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**: FormData with file
- **Returns**: `{ file_url, file_name, file_type, file_size }`

#### Step 2: `linkFileToSession` (from `src/api/sessions.ts`)

- **Endpoint**: `POST /session/files`
- **Content-Type**: `application/json`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**:
  ```json
  {
    "file_url": "string",
    "file_name": "string",
    "file_type": "string",
    "file_size": number,
    "session_id": "string"
  }
  ```
- **Returns**: `SessionFile` object

## Error Handling

The implementation includes comprehensive error handling:

1. **Upload failures**: Caught and displayed to user
2. **Linking failures**: Caught and displayed to user
3. **Network errors**: Detected and handled appropriately
4. **Authentication errors**: Detected and handled appropriately

## User Experience

1. User selects a file
2. User selects a session to link the file to
3. User clicks "Upload File"
4. Progress bar shows upload progress (0-90% during upload)
5. After both steps complete, progress reaches 100%
6. Success message: "File uploaded and linked to session successfully!"
7. File appears in the uploaded files list

## Benefits of Two-Step Pattern

1. **Modularity**: Upload and linking are separate concerns
2. **Flexibility**: Can upload files without linking (for drafts, etc.)
3. **Error isolation**: Upload failures don't affect session data
4. **Maintainability**: Each step can be modified independently
5. **Production-ready**: Common pattern in production applications

## Testing

To test the implementation:

1. Create a study session
2. Open the FileUploader component
3. Select a file (image, PDF, or document)
4. Select a session from the dropdown
5. Click "Upload File"
6. Verify:
   - File uploads successfully
   - File is linked to the selected session
   - Success message appears
   - File appears in the uploaded files list

## Related Files

- `components/FileUploader.tsx` - Main upload component
- `src/api/upload.ts` - File upload API functions
- `src/api/sessions.ts` - Session and file linking API functions
