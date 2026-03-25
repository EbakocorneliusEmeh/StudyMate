# File Upload Feature Testing Guide

This document provides comprehensive testing instructions for the file upload feature, including edge cases and network interruption handling.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Testing the Upload Feature](#testing-the-upload-feature)
4. [Edge Cases Testing](#edge-cases-testing)
5. [Network Interruption Handling](#network-interruption-handling)
6. [Accessibility Testing](#accessibility-testing)
7. [Mobile Responsiveness Testing](#mobile-responsiveness-testing)

## Prerequisites

Before testing, ensure you have:
- Node.js installed (v18+)
- Expo CLI installed
- Backend server running at `http://localhost:3000` (or configured URL)
- Supabase storage bucket configured (`study-files`)
- At least one study session created

## Installation

### 1. Install Dependencies

```bash
cd StudyMate
npm install
```

This will install the new dependency:
- `expo-image-picker` - For selecting files from device

### 2. Start the Application

```bash
# Start Expo development server
npm start

# Or for specific platforms
npm run android
npm run ios
npm run web
```

### 3. Verify Backend is Running

Ensure the NestJS backend is running:
```bash
cd study-mate/study-mate
npm run start:dev
```

The backend should be accessible at `http://localhost:3000`

---

## Testing the Upload Feature

### Test 1: Basic File Upload

**Steps:**
1. Login to the application
2. Navigate to the Sessions page
3. Create a new study session (if none exists)
4. Click the "Upload" button in the header
5. Select a valid file (e.g., an image or PDF)
6. Select a session to link the file to
7. Click "Upload File"
8. Verify the success message appears
9. Verify the file appears in the uploaded files list

**Expected Result:**
- File uploads successfully
- Progress indicator shows upload progress
- Success message: "File uploaded successfully!"
- File appears in the uploaded files list with session name

### Test 2: Upload Different File Types

**Test each allowed file type:**
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Documents: `.pdf`, `.doc`, `.docx`
- Text: `.txt`, `.md`

**Steps:**
1. Open the file uploader
2. Select each file type
3. Upload the file
4. Verify the correct icon is displayed for each file type

**Expected Result:**
- All allowed file types upload successfully
- Correct file type icons are displayed

---

## Edge Cases Testing

### Edge Case 1: Invalid File Type

**Steps:**
1. Open the file uploader
2. Select a file with an unsupported type (e.g., `.exe`, `.mp3`, `.zip`)
3. Observe the validation message

**Expected Result:**
- Error message: "File type not allowed"
- Upload button remains disabled

### Edge Case 2: File Too Large

**Steps:**
1. Create a test file larger than 10MB
2. Attempt to upload the file
3. Observe the validation message

**Expected Result:**
- Error message: "File too large. Maximum size is 10MB"
- Upload button remains disabled

### Edge Case 3: No Session Selected

**Steps:**
1. Select a valid file
2. Do NOT select a session
3. Attempt to click upload

**Expected Result:**
- Error message: "Please select a session to link the file to"
- Upload does not proceed

### Edge Case 4: No File Selected

**Steps:**
1. Open the file uploader
2. Do NOT select any file
3. Observe the upload button state

**Expected Result:**
- Upload button is disabled

### Edge Case 5: Cancel File Selection

**Steps:**
1. Open the file picker
2. After opening, cancel/back out without selecting

**Expected Result:**
- Modal remains open
- No file is selected
- UI remains in initial state

### Edge Case 6: Remove Selected File

**Steps:**
1. Select a valid file
2. Click the X button to remove
3. Verify file is deselected

**Expected Result:**
- Selected file is removed
- File selection area returns to initial state

---

## Network Interruption Handling

### Test 1: Network Loss During Upload

**Steps:**
1. Start uploading a file
2. While upload is in progress, turn off WiFi/disable network
3. Observe the error handling

**Expected Result:**
- Error message: "Unable to connect to server. Please check your internet connection."
- Retry option is available

### Test 2: Slow Network Connection

**Steps:**
1. Throttle network speed (using DevTools or network simulator)
2. Upload a file
3. Observe the progress indicator

**Expected Result:**
- Progress indicator shows incremental progress
- Upload completes successfully despite slow connection

### Test 3: Server Unavailable

**Steps:**
1. Stop the backend server
2. Attempt to upload a file
3. Observe error handling

**Expected Result:**
- Error message: "Unable to connect to server. Please check your internet connection."
- Application remains stable

### Test 4: Token Expiration During Upload

**Steps:**
1. Start an upload
2. Clear the auth token (simulate token expiration)
3. Observe authentication error

**Expected Result:**
- Error message: "No authentication token found" (401)
- User is prompted to re-authenticate

---

## Accessibility Testing

### Test 1: Screen Reader Compatibility

**Steps:**
1. Enable VoiceOver (iOS) or TalkBack (Android)
2. Navigate to Sessions page
3. Open file uploader
4. Navigate through all elements
5. Verify all elements are properly announced

**Expected Result:**
- All buttons, text, and icons are properly announced
- Focus order is logical

### Test 2: Touch Target Size

**Steps:**
1. Verify all interactive elements are at least 44x44 points
2. Test on smallest supported screen size

**Expected Result:**
- All buttons and touch targets meet minimum size requirements

### Test 3: Color Contrast

**Steps:**
1. Check color contrast ratios
2. Test in both light and dark modes (if applicable)

**Expected Result:**
- Text meets WCAG AA contrast requirements (4.5:1 for normal text)

### Test 4: Keyboard Navigation (Web)

**Steps:**
1. Navigate using only keyboard (Tab, Enter, Escape)
2. Verify all functions are accessible

**Expected Result:**
- All interactive elements are keyboard accessible

---

## Mobile Responsiveness Testing

### Test 1: Small Screen (320px width)

**Steps:**
1. Open the app on smallest supported device (320px width)
2. Test file upload flow

**Expected Result:**
- All elements are visible
- No horizontal scrolling required
- Text is readable

### Test 2: Large Screen (Tablet)

**Steps:**
1. Open the app on tablet device
2. Test file upload flow

**Expected Result:**
- UI adapts appropriately
- Elements are not stretched excessively

### Test 3: Portrait and Landscape

**Steps:**
1. Test in portrait mode
2. Rotate to landscape
3. Test file upload flow

**Expected Result:**
- UI adapts to orientation changes
- No elements are cut off

### Test 4: Safe Area Handling

**Steps:**
1. Test on devices with notches (iPhone X+)
2. Test on devices with navigation bars

**Expected Result:**
- Content is not obscured by system UI
- Safe areas are respected

---

## API Endpoints Reference

The file upload feature uses the following backend endpoints:

### POST /api/upload
Uploads a file to Supabase Storage.

**Request:**
- Method: POST
- Headers: 
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data`
- Body:
  - `file`: File binary
  - `folder`: Optional folder name (e.g., `session-<sessionId>`)

**Response:**
```json
{
  "message": "File uploaded successfully",
  "file_name": "example.pdf",
  "file_url": "https://.../study-files/...",
  "file_type": "application/pdf",
  "file_size": 1024000
}
```

### DELETE /api/upload
Deletes a file from storage.

**Request:**
- Method: DELETE
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Body:
  - `file_url`: Full URL of the file to delete

### POST /api/upload/signed-url
Gets a signed URL for private file access.

---

## Troubleshooting

### Issue: "Permission to access media library is required"

**Solution:** The app needs permission to access the device's media library. Go to Settings > Apps > StudyMate > Permissions and enable Media Library access.

### Issue: Upload fails with "File type not allowed"

**Solution:** Ensure you're uploading one of the allowed file types:
- Images: jpg, jpeg, png, gif, webp
- Documents: pdf, doc, docx
- Text: txt, md

### Issue: Large files fail to upload

**Solution:** Ensure the file is under 10MB. For larger files, consider compressing them first.

### Issue: Backend connection errors

**Solution:**
1. Verify backend is running: `curl http://localhost:3000/api`
2. Check network connectivity
3. Verify Supabase credentials in `.env` file

---

## Additional Notes

- Files are stored in Supabase Storage bucket named `study-files`
- Files are organized by user ID and session ID
- Maximum file size: 10MB
- The uploader supports linking files to specific study sessions
- Upload progress is simulated since React Native doesn't provide native upload progress events
