import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export async function upload_file(api_token, path) {
  console.log(`Uploading file: ${path}`);

  // Read the file data
  const data = fs.readFileSync(path);
  const url = "https://api.assemblyai.com/v2/upload";

  try {
    // Send a POST request to the API to upload the file, passing in the headers and the file data
    const response = await fetch(url, {
      method: "POST",
      body: data,
      headers: {
        "Content-Type": "application/octet-stream",
        Authorization: api_token,
      },
    });

    // If the response is successful, return the upload URL
    if (response.status === 200) {
      const responseData = await response.json();
      return responseData["upload_url"];
    } else {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      return null;
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    return null;
  }
}

export async function transcribeAudio(api_token, audio_url) {
  console.log("Transcribing audio... This might take a moment.");

  // Set the headers for the request, including the API token and content type
  const headers = {
    authorization: api_token,
    "content-type": "application/json",
  };

  // Send a POST request to the transcription API with the audio URL in the request body
  const response = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    body: JSON.stringify({ audio_url }),
    headers,
  });

  // Retrieve the ID of the transcript from the response data
  const responseData = await response.json();
  const transcriptId = responseData.id;

  // Construct the polling endpoint URL using the transcript ID
  const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;

  // Poll the transcription API until the transcript is ready
  while (true) {
    // Send a GET request to the polling endpoint to retrieve the status of the transcript
    const pollingResponse = await fetch(pollingEndpoint, { headers });
    const transcriptionResult = await pollingResponse.json();

    // If the transcription is complete, return the transcript object
    if (transcriptionResult.status === "completed") {
      return transcriptionResult;
    }
    // If the transcription has failed, throw an error with the error message
    else if (transcriptionResult.status === "error") {
      throw new Error(`Transcription failed: ${transcriptionResult.error}`);
    }
    // If the transcription is still in progress, wait for a few seconds before polling again
    else {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}