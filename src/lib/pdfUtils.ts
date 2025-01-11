'use client'

const PDF_API_KEY = 'boucharebismail@gmail.com_POKhfqGZEB1v5V2RACc4HZ6bYHIf1x7boQuKQc10be17kQDObnzsS8J0Y9Cd7044';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadFile(file: File): Promise<string> {
  try {
    // Step 1: Get presigned URL
    const presignResponse = await fetch(
      `https://api.pdf.co/v1/file/upload/get-presigned-url?name=${encodeURIComponent(file.name)}`,
      {
        method: 'GET',
        headers: { 'x-api-key': PDF_API_KEY }
      }
    );

    if (!presignResponse.ok) {
      throw new Error('Failed to get upload URL');
    }

    const presignResult = await presignResponse.json();
    console.log('Got presigned URL:', presignResult);

    // Step 2: Upload file using presigned URL
    const uploadResponse = await fetch(presignResult.presignedUrl, {
      method: 'PUT',
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    console.log('File uploaded successfully');
    return presignResult.url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload file');
  }
}

async function convertPdfToText(fileUrl: string): Promise<string> {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      const requestData = {
        url: fileUrl,
        async: false,
        inline: true,
        pages: "1-",  // Changed from "0-" to "1-" as PDF pages start from 1
        lang: "eng"
      };

      console.log('Making conversion request with data:', requestData);

      const convertResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
        method: 'POST',
        headers: {
          'x-api-key': PDF_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!convertResponse.ok) {
        const errorData = await convertResponse.json();
        console.error('PDF.co conversion error:', errorData);
        throw new Error(errorData.message || 'Failed to convert PDF to text');
      }

      const convertResult = await convertResponse.json();
      console.log('Conversion result:', convertResult);

      if (convertResult.error) {
        throw new Error(convertResult.message || 'Conversion failed');
      }

      // The text content is directly in the body field
      if (!convertResult.body) {
        throw new Error('No text content in response');
      }

      return convertResult.body;
    } catch (error) {
      retries++;
      console.error(`Attempt ${retries} failed:`, error);
      
      if (retries === MAX_RETRIES) {
        throw error;
      }
      
      await wait(RETRY_DELAY);
    }
  }

  throw new Error('Failed to convert PDF after all retries');
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    if (file.type !== 'application/pdf') {
      throw new Error('Please upload a PDF file');
    }

    // Step 1: Upload the file
    const fileUrl = await uploadFile(file);
    console.log('File URL:', fileUrl);

    // Step 2: Convert PDF to text with retries
    const text = await convertPdfToText(fileUrl);
    
    // Clean up the text content
    const cleanText = text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    console.log('Text extracted successfully');
    return cleanText;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to process PDF. Please try again.'
    );
  }
}

export function mergePDFContentWithPrompt(pdfContent: string, userPrompt: string): string {
  // Clean and trim the content
  const cleanContent = pdfContent
    .replace(/\s+/g, ' ')
    .trim();

  // Trim to reasonable length while keeping whole words
  const maxLength = 100000; // Increased to capture more PDF content
  const trimmedContent = cleanContent.length > maxLength
    ? cleanContent.substring(0, maxLength).replace(/\s+\S*$/, '') + '...'
    : cleanContent;

  return `Based on the following PDF content, create a comprehensive mind map that addresses this specific focus/question: "${userPrompt}"

PDF Content:
${trimmedContent}

Instructions for mind map creation:
1. Analyze the PDF content thoroughly
2. Focus specifically on aspects relevant to the question: "${userPrompt}"
3. Structure the information hierarchically
4. Include key concepts and their relationships
5. Use clear, concise language
6. Maintain proper context from the PDF
7. Ensure all information is directly from the PDF
8. Make logical connections between concepts

Create a mind map that effectively organizes and presents this information, focusing on:
- Main topics (3-5 key areas from the PDF)
- Subtopics (2-4 per main topic, showing key concepts)
- Key points (2-3 per subtopic, with specific details)
- Brief descriptions where relevant`;
}
