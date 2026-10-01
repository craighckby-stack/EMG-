# Content Sanitization Utility

The `sanitizeContent` module is a security utility designed to detect and redact sensitive credentials—such as API keys and personal access tokens—from arbitrary text inputs prior to storage or transmission.

## Overview

When processing user-generated content or logs, the accidental inclusion of secrets poses a security risk. This utility scans input strings against predefined regular expressions to identify common secret patterns and replaces them with a placeholder string.

## Installation and Usage

Import the `sanitizeContent` function into your TypeScript or JavaScript module:

```typescript
import { sanitizeContent } from './STUDIO_ATTACHMENT_CORRECT';

const result = sanitizeContent("My key is AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P");
console.log(result.blocked);   // true
console.log(result.sanitized); // "My key is [REDACTED_SECRET]"
```

## API Reference

### `sanitizeContent(content: string)`

Scans the input string for hardcoded secrets.

* **Parameters:**
  * `content` (`string`): The text content to analyze and sanitize.
* **Returns:**
  * `Object`
    * `sanitized` (`string`): The processed string with matching secrets replaced by `[REDACTED_SECRET]`.
    * `blocked` (`boolean`): Indicates whether a security violation was detected.
    * `violation` (`string`, optional): The classification code for the detected violation (e.g., `'HARDCODED_CRED'`).

## Implementation

```typescript
/**
 * Evaluates input content against known secret patterns and redacts matches.
 * 
 * @param content - The raw string data to inspect.
 * @returns An object containing the sanitized string, a block flag, and an optional violation code.
 */
export function sanitizeContent(content: string): { sanitized: string; blocked: boolean; violation?: string } {
  // Regex pattern matching Google API keys (AIzaSy...) and GitHub tokens (ghp_...)
  const secretRegex = /AIzaSy[A-Za-z0-9_-]{33}|ghp_[A-Za-z0-9]{36}/g;
  
  if (secretRegex.test(content)) {
    return {
      sanitized: content.replace(secretRegex, '[REDACTED_SECRET]'),
      blocked: true,
      violation: 'HARDCODED_CRED'
    };
  }
  
  return { sanitized: content, blocked: false };
}
```