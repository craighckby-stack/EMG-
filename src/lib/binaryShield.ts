/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-154 [2026-09-20T06:05:09.794Z] */
/**
 * Darlek Caan
 * File Path: "src/lib/binaryShield.ts"
 * Cryptography pipeline featuring strict input boundary validation, deterministic key length verification, and exception propagation safety.
 */

export interface EncryptionPacket {
  readonly data: string;
  readonly iv: string;
  readonly timestamp: number;
  readonly algorithm: string;
}

export interface DecryptionPacket {
  readonly data: string;
  readonly iv: string;
}

// Global lookup tables for high-performance hex conversion
const HEX_LOOKUP: readonly string[] = (() => {
  const table = new Array<string>(256);
  for (let i = 0; i < 256; i++) {
    table[i] = i.toString(16).padStart(2, '0');
  }
  return table;
})();

const BYTE_LOOKUP: Readonly<Uint8Array> = (() => {
  const table = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    table[i] = parseInt(i.toString(16).padStart(2, '0'), 16);
  }
  return table;
})();

// Reusable static encoders/decoders to prevent repetitive allocation overhead
const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

export class BinaryShield {
  private key: CryptoKey | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  constructor(private readonly keyHex: string) {
    if (typeof keyHex !== 'string' || keyHex.length !== 64) {
      throw new Error('Master Key must be a 64-character hex string.');
    }
  }

  private hexToBuffer(hex: string): ArrayBuffer {
    const len = hex.length;
    if (len % 2 !== 0) {
      throw new Error('Invalid hex string length.');
    }
    
    const byteLength = len >> 1;
    const buffer = new ArrayBuffer(byteLength);
    const view = new Uint8Array(buffer);
    
    for (let i = 0, j = 0; i < len; i += 2, j++) {
      const high = parseInt(hex[i], 16);
      const low = parseInt(hex[i + 1], 16);
      if (Number.isNaN(high) || Number.isNaN(low)) {
        throw new Error('Invalid hex characters.');
      }
      view[j] = (high << 4) | low;
    }
    
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    // Fast-path for small buffers or direct character code processing using indexed chunking
    if (len < 0x8000) {
      let binary = '';
      const remainder = len % 8;
      const end = len - remainder;
      let i = 0;
      
      while (i < end) {
        binary += String.fromCharCode(
          bytes[i], bytes[i+1], bytes[i+2], bytes[i+3],
          bytes[i+4], bytes[i+5], bytes[i+6], bytes[i+7]
        );
        i += 8;
      }
      while (i < len) {
        binary += String.fromCharCode(bytes[i++]);
      }
      return btoa(binary);
    }

    let binary = '';
    const CHUNK_SIZE = 0x8000;
    for (let i = 0; i < len; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, i + CHUNK_SIZE < len ? i + CHUNK_SIZE : len);
      const chunkLen = chunk.length;
      let chunkStr = '';
      for (let j = 0; j < chunkLen; j++) {
        chunkStr += String.fromCharCode(chunk[j]);
      }
      binary += chunkStr;
    }
    
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      
      let i = 0;
      const remainder = len % 8;
      const end = len - remainder;
      
      while (i < end) {
        bytes[i] = binaryString.charCodeAt(i);
        bytes[i+1] = binaryString.charCodeAt(i+1);
        bytes[i+2] = binaryString.charCodeAt(i+2);
        bytes[i+3] = binaryString.charCodeAt(i+3);
        bytes[i+4] = binaryString.charCodeAt(i+4);
        bytes[i+5] = binaryString.charCodeAt(i+5);
        bytes[i+6] = binaryString.charCodeAt(i+6);
        bytes[i+7] = binaryString.charCodeAt(i+7);
        i += 8;
      }
      
      while (i < len) {
        bytes[i] = binaryString.charCodeAt(i);
        i++;
      }
      
      return bytes.buffer;
    } catch {
      throw new Error('Invalid base64 string.');
    }
  }

  public async initialize(): Promise<void> {
    if (this.key) return;
    
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    
    this.initPromise = (async () => {
      try {
        const keyBuffer = this.hexToBuffer(this.keyHex);
        if (keyBuffer.byteLength !== 32) {
          throw new Error('Master Key must be 32 bytes (64 hex characters).');
        }
        
        this.key = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        throw new Error(`Encryption initialization failed: ${errorMessage}`);
      } finally {
        this.isInitializing = false;
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  public async encryptPacket(plaintext: string): Promise<EncryptionPacket> {
    if (typeof plaintext !== 'string') {
      throw new Error('Plaintext must be a string.');
    }

    if (!this.key) {
      await this.initialize();
    }
    
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const encoded = TEXT_ENCODER.encode(plaintext);
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      this.key!,
      encoded
    );

    return {
      data: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(nonce),
      timestamp: Math.floor(Date.now() / 1000),
      algorithm: 'AES-256-GCM'
    };
  }

  public async decryptPacket(packet: DecryptionPacket): Promise<string> {
    if (!packet || typeof packet !== 'object') {
      throw new Error('Invalid packet format.');
    }

    if (typeof packet.data !== 'string' || typeof packet.iv !== 'string') {
      throw new Error('Invalid packet data or iv format.');
    }

    try {
      if (!this.key) {
        await this.initialize();
      }
      
      const nonce = this.base64ToArrayBuffer(packet.iv);
      const ciphertext = this.base64ToArrayBuffer(packet.data);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce },
        this.key!,
        ciphertext
      );
      
      return TEXT_DECODER.decode(decrypted);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Decryption failed: ${errorMessage}`);
    }
  }

  public async clear(): Promise<void> {
    this.key = null;
    this.isInitializing = false;
    this.initPromise = null;
  }
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 151,
  timestamp: "2026-09-20T04:00:54.857Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});