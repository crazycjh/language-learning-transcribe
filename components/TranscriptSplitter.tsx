"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface OpenAIResult {
  data: {
    content?: string;
    error?: string;
    status?: string;
    [key: string]: unknown;
  };
}

function TranscriptSplitter() {
  const [chunks, setChunks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentencesPerSplit, setSentencesPerSplit] = useState(5); // Default value
  const [openaiResults, setOpenaiResults] = useState<OpenAIResult[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setChunks([]);
    setError(null);
    setIsLoading(true);

    if (file) {
      const reader = new FileReader();

      reader.onload = async (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result as string;

        try {
          const response = await fetch('/api/sentence-split', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: content, sentencesPerSplit: parseInt(sentencesPerSplit.toString()) }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setChunks(data.splits || []);
        } catch (err: unknown) {
          console.error("Failed to split transcript:", err);
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred while splitting.");
          }
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        console.error("Failed to read file");
        setError("Failed to read the selected file.");
        setIsLoading(false);
      };

      reader.readAsText(file);
    } else {
      setIsLoading(false);
    }
  }, [setIsLoading, setChunks, setError, sentencesPerSplit]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "text/vtt": [".vtt"],
    },
  });

  return (
    <>
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-md p-4 cursor-pointer bg-slate-900 border-slate-700 hover:border-blue-500 transition-colors"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-slate-300">Drop the files here ...</p>
        ) : (
          <p className="text-slate-300">
            Drag and drop some files here, or click to select files
          </p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="sentencesPerSplit" className="block text-sm font-medium text-slate-300">
          Sentences per split:
        </label>
        <input
          type="number"
          id="sentencesPerSplit"
          className="mt-1 p-2 border rounded-md shadow-sm bg-slate-800 border-slate-700 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={sentencesPerSplit}
          onChange={(e) => setSentencesPerSplit(parseInt(e.target.value))}
        />
      </div>

      <button
        onClick={async () => {
          setIsLoading(true);
          try {
            const results = await Promise.all(
              chunks.map(async (chunk) => {
                const response = await fetch('/api/openai', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ prompt: chunk }),
                });
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                return data;
              })
            );
            setOpenaiResults(results);
          } catch (err: unknown) {
            if (err instanceof Error) {
              setError(err.message);
            } else {
              setError("An unknown error occurred");
            }
          } finally {
            setIsLoading(false);
          }
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 transition-colors"
      >
        Process with OpenAI
      </button>

      {isLoading && (
        <div className="flex items-center text-slate-300 mt-4">
          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-900 text-red-100 p-3 rounded-md mt-4">
          Error: {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-4 mt-4">
          {chunks.map((chunk, index) => (
            <div
              key={index}
              className="bg-slate-800 border border-slate-700 rounded-md p-4 text-slate-100"
            >
              {chunk}
            </div>
          ))}
          {openaiResults.map((result: OpenAIResult, index: number) => (
            <div key={index} className="space-y-2">
              <p className="font-bold text-slate-300">OpenAI Result {index + 1}:</p>
              <pre className="bg-slate-900 p-4 rounded-md text-slate-100 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default TranscriptSplitter;
