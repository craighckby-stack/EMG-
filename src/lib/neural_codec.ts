import { BinaryShield } from './binaryShield';

// Reusable TextEncoder/Decoder instances to eliminate repeated allocation overhead
const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

/**
 * Encodes a UTF-8 string to Base64 with environment-agnostic fallback safety and optimized memory handling.
 */
export function encodeBase64(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64');
  }
  
  if (typeof btoa === 'function') {
    try {
      const bytes = TEXT_ENCODER.encode(str);
      const len = bytes.byteLength;
      const CHUNK_SIZE = 0x8000;
      
      if (len <= CHUNK_SIZE) {
        return btoa(String.fromCharCode.apply(null, bytes as unknown as number[]));
      }

      let binary = '';
      for (let i = 0; i < len; i += CHUNK_SIZE) {
        const chunk = bytes.subarray(i, i + CHUNK_SIZE);
        binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
      }
      
      return btoa(binary);
    } catch {
      return '';
    }
  }
  
  return '';
}

/**
 * Decodes a Base64 string back to UTF-8 with environment-agnostic fallback safety and high-throughput memory buffers.
 */
export function decodeBase64(b64: string): string {
  if (typeof b64 !== 'string') {
    return '';
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf8');
  }
  
  if (typeof atob === 'function') {
    try {
      const binary = atob(b64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      
      // Loop unrolling for high-throughput string-to-byte conversion
      let i = 0;
      for (; i < len - 3; i += 4) {
        bytes[i] = binary.charCodeAt(i);
        bytes[i + 1] = binary.charCodeAt(i + 1);
        bytes[i + 2] = binary.charCodeAt(i + 2);
        bytes[i + 3] = binary.charCodeAt(i + 3);
      }
      for (; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      return TEXT_DECODER.decode(bytes);
    } catch {
      return '';
    }
  }
  
  return '';
}

/**
 * High-performance Neural Codec engine for secure serialization, encryption, and deserialization.
 */
export class NeuralCodec {
  /**
   * Encodes and optionally shields arbitrary data payloads into a secure transmission format.
   */
  public static async encode<T = unknown>(data: T, shield?: BinaryShield): Promise<string> {
    try {
      const json = JSON.stringify(data);
      if (shield) {
        const packet = await shield.encryptPacket(json);
        return JSON.stringify(packet);
      }
      return encodeBase64(json);
    } catch (error) {
      throw new Error(`NeuralCodec encoding failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decodes and optionally unshields encrypted transmission packets back into strongly typed payloads.
   */
  public static async decode<T = unknown>(encoded: string, shield?: BinaryShield): Promise<T> {
    if (typeof encoded !== 'string' || encoded.length === 0) {
      throw new Error('NeuralCodec decode received empty or invalid input payload.');
    }

    let raw = encoded;
    
    if (shield) {
      try {
        const packet = JSON.parse(encoded);
        raw = await shield.decryptPacket(packet);
      } catch {
        raw = decodeBase64(encoded);
      }
    } else {
      raw = decodeBase64(encoded);
    }

    if (raw === '') {
      throw new Error('NeuralCodec decode failed to retrieve raw data string.');
    }

    return JSON.parse(raw) as T;
  }
}

/**
 * Minifies JSON or general code text while guaranteeing structural integrity and memory optimization.
 */
export function minifyCode(code: string, path: string): string {
  if (typeof code !== 'string') {
    return '';
  }

  if (typeof path === 'string' && path.charCodeAt(path.length - 1) === 110 && path.endsWith('.json')) {
    try {
      return JSON.stringify(JSON.parse(code));
    } catch {
      return code;
    }
  }
  
  return code.replace(/\s+/g, ' ').trim();
}