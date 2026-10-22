'use client';

import { FormEvent, useState } from 'react';

type GenerateResult = {
  signedPath: string;
  verifyParam: string;
  issuedAt: number;
  expiresAt: number;
  ttlSeconds: number;
};

type VerifySuccess = {
  valid: true;
  issuedAt: number;
  expiresAt: number;
  path: string;
  ttlSeconds: number;
};

type VerifyFailure = {
  valid: false;
  reason?: string;
  ttlSeconds: number;
};

type VerifyResult = VerifySuccess | VerifyFailure;

const DEFAULT_PATH = '/media/protected-file.pdf';

export default function HmacPage() {
  const [pathInput, setPathInput] = useState(DEFAULT_PATH);
  const [ttlInput, setTtlInput] = useState('60');
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [signedPathInput, setSignedPathInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGenerating(true);
    setGenerateError(null);
    setGenerateResult(null);

    const ttlSeconds = Number(ttlInput);

    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      setGenerateError('TTL must be a positive number.');
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch('/api/hmac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'generate', path: pathInput, ttlSeconds }),
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        setGenerateError(typeof data.error === 'string' ? data.error : 'Failed to generate token.');
        return;
      }

      const payload = data as GenerateResult;
      setGenerateResult(payload);
      setSignedPathInput(payload.signedPath);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Unexpected error.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsVerifying(true);
    setVerifyError(null);
    setVerifyResult(null);

    const ttlSeconds = Number(ttlInput);

    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      setVerifyError('TTL must be a positive number.');
      setIsVerifying(false);
      return;
    }

    try {
      const response = await fetch('/api/hmac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'verify', path: signedPathInput, ttlSeconds }),
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        setVerifyError(typeof data.error === 'string' ? data.error : 'Failed to verify token.');
        return;
      }

      setVerifyResult(data as VerifyResult);
    } catch (error) {
      setVerifyError(error instanceof Error ? error.message : 'Unexpected error.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6">
      <div className="w-full max-w-3xl space-y-10">
        <section className="space-y-4">
          <h1 className="text-3xl font-bold">HMAC Token Authentication</h1>
          <p className="text-gray-700">
            This demo mirrors Option 1 from Cloudflare&rsquo;s token authentication guide by generating and
            validating signed URLs at the edge. The signature covers the request pathname combined with a
            timestamp, matching the Worker example that integrates with WAF custom rules.
          </p>
        </section>

        <section className="rounded border border-gray-200 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">1. Generate a signed path</h2>
          <form className="space-y-4" onSubmit={handleGenerate}>
            <div className="flex flex-col">
              <label htmlFor="path" className="font-semibold">Path to protect</label>
              <input
                id="path"
                type="text"
                value={pathInput}
                onChange={(event) => setPathInput(event.target.value)}
                className="mt-1 rounded border border-gray-300 p-2"
                placeholder="/media/protected-file.pdf"
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="ttl" className="font-semibold">Token lifetime (seconds)</label>
              <input
                id="ttl"
                type="number"
                min={1}
                value={ttlInput}
                onChange={(event) => setTtlInput(event.target.value)}
                className="mt-1 rounded border border-gray-300 p-2"
                required
              />
            </div>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate signed URL'}
            </button>
          </form>
          {generateError && <p className="mt-4 text-red-600">{generateError}</p>}
          {generateResult && (
            <div className="mt-4 space-y-2 rounded bg-gray-100 p-4 text-sm">
              <p><span className="font-semibold">Signed path:</span> {generateResult.signedPath}</p>
              <p><span className="font-semibold">verify param:</span> {generateResult.verifyParam}</p>
              <p><span className="font-semibold">Expires:</span> {new Date(generateResult.expiresAt * 1000).toLocaleString()}</p>
            </div>
          )}
        </section>

        <section className="rounded border border-gray-200 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">2. Verify a signed request</h2>
          <form className="space-y-4" onSubmit={handleVerify}>
            <div className="flex flex-col">
              <label htmlFor="signed-path" className="font-semibold">Signed path (with verify parameter)</label>
              <input
                id="signed-path"
                type="text"
                value={signedPathInput}
                onChange={(event) => setSignedPathInput(event.target.value)}
                className="mt-1 rounded border border-gray-300 p-2"
                placeholder="/media/protected-file.pdf?verify=..."
                required
              />
            </div>
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:bg-green-400"
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify signature'}
            </button>
          </form>
          {verifyError && <p className="mt-4 text-red-600">{verifyError}</p>}
          {verifyResult && verifyResult.valid && (
            <div className="mt-4 space-y-2 rounded bg-gray-100 p-4 text-sm text-green-700">
              <p className="font-semibold">Signature valid</p>
              <p><span className="font-semibold">Path:</span> {verifyResult.path}</p>
              <p><span className="font-semibold">Expires:</span> {new Date(verifyResult.expiresAt * 1000).toLocaleString()}</p>
            </div>
          )}
          {verifyResult && !verifyResult.valid && (
            <div className="mt-4 space-y-2 rounded bg-gray-100 p-4 text-sm text-red-700">
              <p className="font-semibold">Signature invalid</p>
              <p>{verifyResult.reason ?? 'Unknown reason.'}</p>
            </div>
          )}
        </section>

        <section className="space-y-2 text-sm text-gray-600">
          <p>
            The symmetric key and TTL come from `HMAC_SECRET` and `HMAC_TOKEN_TTL` bindings (configured in
            `wrangler.toml`). Deploying this Next.js Pages project to Cloudflare automatically runs the same
            logic on the edge, matching the Worker-based Option 1 flow from the documentation.
          </p>
        </section>
      </div>
    </main>
  );
}
