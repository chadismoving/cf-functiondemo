'use client'; // Mark this component as a Client Component

import { useEffect, useState } from 'react';

// File Upload Component
function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadStatus(null); // Reset status on new file selection
  };

  const handleFileUpload = async () => {
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'PUT',
          body: formData,
        });

        if (response.ok) {
          setUploadStatus('File uploaded successfully!');
        } else {
          setUploadStatus('Failed to upload file');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadStatus('An error occurred during the upload');
      }
    } else {
      setUploadStatus('No file selected');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">File Upload to R2</h2>
      <label htmlFor="file-upload" className="font-semibold">Upload Zip File:</label>
      <input
        type="file"
        id="file-upload"
        accept=".zip"
        onChange={handleFileChange}
        className="border border-gray-300 p-2 rounded w-64"
      />
      <div className="mt-2">
        <button
          onClick={handleFileUpload}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 w-64"
        >
          Upload File
        </button>
      </div>
      {uploadStatus && (
        <p className={`mt-4 ${uploadStatus.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
          {uploadStatus}
        </p>
      )}
    </div>
  );
}

// Turnstile with Name Input Component
function TurnstileForm() {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    const turnstileScript = document.createElement('script');
    turnstileScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    turnstileScript.async = true;
    document.head.appendChild(turnstileScript);

    return () => {
      document.head.removeChild(turnstileScript);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.turnstile) {
        window.turnstile.render('.cf-turnstile', {
          sitekey: '0x4AAAAAAAlnBipnK0qu74qD',
          callback: (token: string) => setTurnstileToken(token),
        });
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!turnstileToken) {
      alert('Turnstile validation failed. No token received.');
      return;
    }

    const formData = new FormData(event.target as HTMLFormElement);
    const name = formData.get('name');

    if (!name) {
      alert('Please enter your name.');
      return;
    }

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, turnstileToken }),
      });

      if (response.ok) {
        alert('Form submitted successfully!');
        setTurnstileToken(null); // Reset the token
      } else {
        const errorData = await response.json();
        console.error('Error submitting form:', errorData);
        alert('Submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while submitting the form.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Cloudflare Turnstile</h2>
      <form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
        <label htmlFor="name" className="font-semibold">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          className="border border-gray-300 p-2 rounded w-64"
          placeholder="Enter your name"
        />
        <div className="cf-turnstile" />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 w-64"
        >
          Submit
        </button>
      </form>
    </div>
  );
}


// Actions Component
function Actions() {
  const handleLinkClick = async (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, url: string) => {
    event.preventDefault(); // Prevent default navigation

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json', // Add the Accept header
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched Data:', data);
      } else {
        console.error('Failed to fetch the resource:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching the resource:', error);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Actions</h2>
      <ul className="list-disc pl-8">
        <li><a href="/action-managedchallenge">Managed Challenge</a></li>
        <ul className="list-disc pl-8">
          <li><a href="/action-managedchallenge?cf-action=rl">Rate Limiting Rule Managed Challenge</a></li>
          <li><a href="/action-managedchallenge?cf-action=mr&username=%27or1=1/*&password=1">Managed Rule Managed Challenge</a></li>
        </ul>
        <li><a href="/action-block">Custom Rules Default Block</a></li>
        <ul className="list-disc pl-8">
          <li><a href="/action-block?cf-action=customhtml">Custom HTML</a></li>
          <li><a href="/action-block?cf-action=customtext">Custom Text</a></li>
          <li><a href="/action-block?cf-action=customjson">Custom JSON</a></li>
          <li><a href="/action-block?cf-action=customxml">Custom XML</a></li>
          <li><a href="/action-block?cf-action=rl">Rate Limiting Rule Default Block</a></li>
          <li><a href="/action-block?cf-action=mr&username=%27or1=1/*&password=1">Managed Rule Default Block</a></li>
        </ul>
        <li><a href="/action-jschallenge">Custom Rules JS Challenge</a></li>
        <li><a href="/action-interactivechallenge">Interactive Challenge</a></li>
        <li><a href="/RL2layer">2 Layer RL</a></li>
        <li><a href="/hmac">HMAC</a></li>
        <li><a href="/hmac-with-workers">HMAC with Workers</a></li>
      </ul>

    <h2 className="text-2xl font-semibold mb-4">Cloudflare Waiting Room</h2>
    <ul className="list-disc pl-8">
      <li><a href="/waiting-room">Enter Waiting Room</a></li>
      <li>
        <a
          href="/waiting-room-json"
          onClick={(event) => handleLinkClick(event, '/waiting-room-json')}
          className="text-blue-500 underline"
        >
          Enter Waiting Room(json/mobile)
        </a>
      </li>
    </ul>

    <h2 className="text-2xl font-semibold mb-4">Detection - Sensitive Data Demo(WIP)</h2>
    <ul className="list-disc pl-8">
      <li><a href="/reveal-aws-key">Reveal a Sample AWS API Key</a></li>
      <li><a href="/download-zip">Download Sensitive Zip File</a></li>
      </ul>
    </section>
  );
}

// Main Component
export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between p-24 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Cloudflare Security Functions</h1>
      <div className="w-full max-w-4xl space-y-12">
        <Actions />
        <TurnstileForm />
        <FileUpload />
      </div>
    </main>
  );
}
