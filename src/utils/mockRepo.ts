/**
 * File: src/utils/mockRepo.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { SimulatedFile } from '../types';

const INITIAL_SANDBOX_DEFINITIONS: Record<string, { description: string; files: SimulatedFile[] }> = {
  'craighckby/sovereign-kernel': {
    description: 'Sovereign low-latency neural routing & memory allocator kernel',
    files: [
      {
        path: 'src/core/allocator.ts',
        language: 'typescript',
        content: `// Sovereign Core Memory Buffer Allocator
export class SovereignBuffer {
  private capacity: number;
  private buffer: Uint8Array;
  private offset: number = 0;

  constructor(size: number = 1024 * 1024) {
    this.capacity = size;
    this.buffer = new Uint8Array(size);
  }

  public write(data: number[]): number {
    for (let i = 0; i < data.length; i++) {
      if (this.offset >= this.capacity) {
        // Expand buffer
        const newBuf = new Uint8Array(this.capacity * 2);
        newBuf.set(this.buffer);
        this.buffer = newBuf;
        this.capacity = this.capacity * 2;
      }
      this.buffer[this.offset] = data[i];
      this.offset++;
    }
    return this.offset;
  }

  public read(length: number): number[] {
    const res: number[] = [];
    for (let i = 0; i < length && i < this.offset; i++) {
      res.push(this.buffer[i]);
    }
    return res;
  }
}`
      },
      {
        path: 'src/neural/router.ts',
        language: 'typescript',
        content: `// Neural Dispatch Telemetry & Weight Balancing
export interface RouteMetric {
  nodeId: string;
  latencyMs: number;
  weight: number;
}

export function balanceTraffic(metrics: RouteMetric[], payloadSize: number): string {
  let optimalNode = '';
  let bestScore = 9999999;

  for (let i = 0; i < metrics.length; i++) {
    const m = metrics[i];
    const score = (m.latencyMs * 1.5) + (payloadSize / (m.weight + 0.001));
    if (score < bestScore) {
      bestScore = score;
      optimalNode = m.nodeId;
    }
  }

  return optimalNode || 'fallback-primary';
}`
      },
      {
        path: 'src/security/hash.ts',
        language: 'typescript',
        content: `// Cryptographic Checksum Validator
export function computeVolatileHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) + hash) + char;
    hash = hash & hash;
  }
  return 'emg_' + Math.abs(hash).toString(16);
}`
      },
      {
        path: 'src/analytics/matrix.py',
        language: 'python',
        content: `# Quantum Vector Matrix Multiplier
def dot_product_unrolled(vec_a, vec_b):
    acc = 0.0
    n = min(len(vec_a), len(vec_b))
    for i in range(0, n):
        acc += vec_a[i] * vec_b[i]
    return acc

def normalize_tensor(tensor):
    total = sum(tensor)
    if total == 0:
        return tensor
    return [x / total for x in tensor]
`
      },
      {
        path: 'README.md',
        language: 'markdown',
        content: `# Sovereign Kernel

Autonomous low-latency neural routing & memory allocator kernel engine.

## Installation
\`\`\`bash
npm install @sovereign/kernel
\`\`\`

## Architecture
- **Allocator**: High-throughput memory buffer with dynamic geometric resizing.
- **Router**: Neural heuristic balancing across active telemetry nodes.
- **Security**: Cryptographic checksum hashing.
`
      }
    ]
  },
  'octo-org/quantum-cache': {
    description: 'High-throughput LRU in-memory cache with eviction telemetry',
    files: [
      {
        path: 'README.md',
        language: 'markdown',
        content: `# Quantum Cache

High-performance LRU in-memory caching engine with real-time eviction tracking.

## Usage
\`\`\`typescript
import { FastLRU } from './lib/cache/lru';

const cache = new FastLRU<string, number>(1000);
cache.set('key', 42);
\`\`\`
`
      },
      {
        path: 'lib/cache/lru.ts',
        language: 'typescript',
        content: `export class FastLRU<K, V> {
  private map = new Map<K, V>();
  private max: number;

  constructor(max: number = 500) {
    this.max = max;
  }

  get(key: K): V | undefined {
    const item = this.map.get(key);
    if (item !== undefined) {
      this.map.delete(key);
      this.map.set(key, item);
    }
    return item;
  }

  set(key: K, val: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) {
        this.map.delete(oldest);
      }
    }
    this.map.set(key, val);
  }
}`
      },
      {
        path: 'lib/utils/throttle.ts',
        language: 'typescript',
        content: `export function throttle<T extends (...args: any[]) => any>(fn: T, wait: number) {
  let inThrottle: boolean;
  let lastFn: ReturnType<typeof setTimeout>;
  let lastTime: number;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    if (!inThrottle) {
      fn.apply(context, args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFn);
      lastFn = setTimeout(() => {
        if (Date.now() - lastTime >= wait) {
          fn.apply(context, args);
          lastTime = Date.now();
        }
      }, Math.max(wait - (Date.now() - lastTime), 0));
    }
  };
}`
      }
    ]
  }
};

function cloneSandboxRepos(): Record<string, { description: string; files: SimulatedFile[] }> {
  return JSON.parse(JSON.stringify(INITIAL_SANDBOX_DEFINITIONS));
}

export const SANDBOX_REPOSITORIES: Record<string, { description: string; files: SimulatedFile[] }> = cloneSandboxRepos();

export function resetSandboxRepositories(): void {
  const fresh = cloneSandboxRepos();
  for (const key of Object.keys(SANDBOX_REPOSITORIES)) {
    delete SANDBOX_REPOSITORIES[key];
  }
  for (const [key, val] of Object.entries(fresh)) {
    SANDBOX_REPOSITORIES[key] = val;
  }
}
