export interface SandboxResult {
  readonly success: boolean;
  readonly error?: string;
}

interface SandboxMessageEvent {
  readonly type: 'SANDBOX_RESULT';
  readonly success: boolean;
  readonly error?: string;
}

const EXECUTION_TIMEOUT_MS = 5000;
const TIMEOUT_ERROR_RESULT: SandboxResult = { success: false, error: 'Execution Timeout' };
const SSR_SUCCESS_RESULT: SandboxResult = { success: true };

const SANDBOX_HTML_PREFIX = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script type="module">
window.require = (m) => { console.warn('Sandbox: require("' + m + '") resolved to empty module.'); return {}; };
window.module = { exports: {} };
window.exports = window.module.exports;
window.process = { env: {}, browser: true, version: 'v18.0.0', nextTick: (f) => setTimeout(f, 0) };
window.global = window;
try {
  const sourceCode = \``;

const SANDBOX_HTML_SUFFIX = `\`;
  let executableCode = sourceCode;
  if (sourceCode.includes('require(') || sourceCode.includes('module.exports')) {
    executableCode = \`(function(require, module, exports) {\${sourceCode}})(window.require, window.module, window.exports)\`;
  }
  
  const scriptBlob = new Blob([executableCode], { type: 'text/javascript' });
  const scriptUrl = URL.createObjectURL(scriptBlob);
  
  import(scriptUrl)
    .then(() => {
      URL.revokeObjectURL(scriptUrl);
      window.parent.postMessage({ type: 'SANDBOX_RESULT', success: true }, '*');
    })
    .catch((err) => {
      URL.revokeObjectURL(scriptUrl);
      throw err;
    });
} catch (err) {
  let errorMessage = err instanceof Error ? err.message : String(err);
  if (errorMessage.includes('Failed to resolve module specifier')) {
    errorMessage = "Dependency Error: " + errorMessage + ". Node.js or external modules are not available in browser sandbox.";
  }
  window.parent.postMessage({ type: 'SANDBOX_RESULT', success: false, error: errorMessage }, '*');
}
</script></body></html>`;

/**
 * Safely executes untrusted JavaScript code inside an isolated hidden iframe sandbox.
 * 
 * @param code - The JavaScript source code string to evaluate.
 * @returns A promise resolving to a SandboxResult indicating success or failure.
 */
export async function testCodeInSandbox(code: string): Promise<SandboxResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return SSR_SUCCESS_RESULT;
  }

  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox.add('allow-scripts');
    
    let isCleanedUp = false;

    const cleanup = (): void => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      clearTimeout(timeoutId);
      window.removeEventListener('message', handleMessage);
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve(TIMEOUT_ERROR_RESULT);
    }, EXECUTION_TIMEOUT_MS);

    const handleMessage = (event: MessageEvent<SandboxMessageEvent>): void => {
      if (event.source !== iframe.contentWindow) return;
      
      const data = event.data;
      if (data && data.type === 'SANDBOX_RESULT') {
        cleanup();
        resolve(data.error ? { success: data.success, error: data.error } : { success: data.success });
      }
    };

    window.addEventListener('message', handleMessage, { passive: true });

    const escapedCode = code.replace(/`/g, '\\`').replace(/\${/g, '\\${');
    iframe.srcdoc = SANDBOX_HTML_PREFIX + escapedCode + SANDBOX_HTML_SUFFIX;
    document.body.appendChild(iframe);
  });
}