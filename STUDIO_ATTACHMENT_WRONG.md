# STUDIO_ATTACHMENT_WRONG.md - EMG Sovereign Kernel Failure & Recovery Ledger

Paired failure and recovery commits categorized by error class and preventative rules.

---

## FAILURE: `f01err901` | FIX: `f01fix901`

- **Error Class:** `HARDCODED_CRED`
- **File:** `src/config.ts`
- **Description:** Hardcoded API key leaked in client configuration.

### Failure Diff
```typescript
const GEMINI_API_KEY = "[REDACTED_GEMINI_KEY]";
```

### Paired Fix Diff
```typescript
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
```

- **Rule to Avoid:** Never hardcode GCP or Gemini API keys in source files. Always use environment variables or server proxies.

---

## FAILURE: `f02err902` | FIX: `f02fix902`

- **Error Class:** `AST_PARSE`
- **File:** `src/components/Header.tsx`
- **Description:** Unclosed JSX tag leading to AST parse failure.

### Failure Diff
```tsx
export function Header() {
  return <div><h1>Title</h1>
}
```

### Paired Fix Diff
```tsx
export function Header() {
  return <div><h1>Title</h1></div>;
}
```

- **Rule to Avoid:** Verify JSX closing tags and AST balance before committing.

---

## FAILURE: `f03err903` | FIX: `f03fix903`

- **Error Class:** `PII`
- **File:** `src/utils/telemetry.ts`
- **Description:** Hardcoded user email address logged in raw output.

### Failure Diff
```typescript
console.log("User email:", "user@example.com");
```

### Paired Fix Diff
```typescript
console.log("User session active:", userId);
```

- **Rule to Avoid:** Redact or omit personal emails and identifiers from console logs and telemetry.