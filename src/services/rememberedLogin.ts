const REMEMBERED_LOGIN_STORAGE_KEY = 'im_remembered_login_v1';
const REMEMBERED_LOGIN_DEVICE_KEY = 'im_remembered_login_key_v1';

interface StoredAccountCipher {
  email: string;
  cipher: string;
  iv?: string;
  mode: 'aes-gcm' | 'xor';
  updatedAt: number;
}

interface StoredRememberedLogin {
  remember: boolean;
  email: string;
  cipher?: string;
  iv?: string;
  mode?: 'aes-gcm' | 'xor';
  updatedAt?: number;
  accounts?: Record<string, StoredAccountCipher>;
}

export interface RememberedLoginSnapshot {
  remember: boolean;
  email: string;
  password: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getOrCreateRawKey(): Uint8Array {
  try {
    const existing = localStorage.getItem(REMEMBERED_LOGIN_DEVICE_KEY);
    if (existing) {
      const decoded = base64ToBytes(existing);
      if (decoded.length === 32) return decoded;
    }
  } catch {
    // Ignore corrupted key and regenerate below
  }

  const keyBytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(keyBytes);
  } else {
    for (let i = 0; i < 32; i += 1) keyBytes[i] = (i * 37 + 91) & 0xff;
  }

  try {
    localStorage.setItem(REMEMBERED_LOGIN_DEVICE_KEY, bytesToBase64(keyBytes));
  } catch {
    // Ignore storage quota errors
  }
  return keyBytes;
}

async function encryptSecret(plainText: string): Promise<{ cipher: string; iv?: string; mode: 'aes-gcm' | 'xor' }> {
  const rawKey = getOrCreateRawKey();
  const encoded = new TextEncoder().encode(plainText);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const iv = new Uint8Array(12);
      crypto.getRandomValues(iv);
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        rawKey.buffer.slice(rawKey.byteOffset, rawKey.byteOffset + rawKey.byteLength) as ArrayBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoded);
      return {
        cipher: bytesToBase64(new Uint8Array(encrypted)),
        iv: bytesToBase64(iv),
        mode: 'aes-gcm',
      };
    } catch {
      // Fallback below when subtle crypto fails in non-secure context
    }
  }

  const xored = new Uint8Array(encoded.length);
  for (let i = 0; i < encoded.length; i += 1) {
    xored[i] = encoded[i] ^ rawKey[i % rawKey.length];
  }
  return {
    cipher: bytesToBase64(xored),
    mode: 'xor',
  };
}

async function decryptSecret(entry: { cipher?: string; iv?: string; mode?: 'aes-gcm' | 'xor' }): Promise<string> {
  if (!entry.cipher) return '';
  const rawKey = getOrCreateRawKey();

  if (entry.mode === 'aes-gcm' && entry.iv && typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        rawKey.buffer.slice(rawKey.byteOffset, rawKey.byteOffset + rawKey.byteLength) as ArrayBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBytes(entry.iv) as BufferSource },
        cryptoKey,
        base64ToBytes(entry.cipher) as BufferSource
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      return '';
    }
  }

  if (entry.mode === 'xor') {
    try {
      const cipherBytes = base64ToBytes(entry.cipher);
      const plainBytes = new Uint8Array(cipherBytes.length);
      for (let i = 0; i < cipherBytes.length; i += 1) {
        plainBytes[i] = cipherBytes[i] ^ rawKey[i % rawKey.length];
      }
      return new TextDecoder().decode(plainBytes);
    } catch {
      return '';
    }
  }

  return '';
}

function readRawRecord(): StoredRememberedLogin | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(REMEMBERED_LOGIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRememberedLogin;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getRememberedLoginInitialValues(): { remember: boolean; email: string } {
  const stored = readRawRecord();
  if (!stored) {
    return { remember: true, email: '' };
  }
  if (!stored.remember) {
    return { remember: false, email: '' };
  }
  return {
    remember: true,
    email: typeof stored.email === 'string' ? stored.email : '',
  };
}

export async function loadRememberedLogin(): Promise<RememberedLoginSnapshot> {
  const stored = readRawRecord();
  if (!stored) {
    return { remember: true, email: '', password: '' };
  }
  if (!stored.remember || !stored.email) {
    return { remember: Boolean(stored.remember), email: '', password: '' };
  }
  const password = await decryptSecret(stored);
  return {
    remember: true,
    email: stored.email,
    password,
  };
}

export async function loadRememberedPasswordForEmail(email: string): Promise<string> {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return '';
  const stored = readRawRecord();
  const entry = stored?.accounts?.[normalized];
  if (!entry) return '';
  return decryptSecret(entry);
}

export async function saveRememberedLogin(email: string, password: string, remember: boolean): Promise<void> {
  if (typeof window === 'undefined') return;
  const cleanEmail = (email || '').trim();
  const normalizedKey = cleanEmail.toLowerCase();
  const existing = readRawRecord();
  const accounts: Record<string, StoredAccountCipher> = { ...(existing?.accounts || {}) };

  if (!remember) {
    if (normalizedKey) {
      delete accounts[normalizedKey];
    }
    const nextRecord: StoredRememberedLogin = {
      remember: false,
      email: '',
      accounts,
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(REMEMBERED_LOGIN_STORAGE_KEY, JSON.stringify(nextRecord));
    } catch {
      // Ignore storage write errors
    }
    return;
  }

  if (!cleanEmail || !password) return;

  const encrypted = await encryptSecret(password);
  const accountEntry: StoredAccountCipher = {
    email: cleanEmail,
    cipher: encrypted.cipher,
    iv: encrypted.iv,
    mode: encrypted.mode,
    updatedAt: Date.now(),
  };

  accounts[normalizedKey] = accountEntry;
  // Giữ tối đa 5 tài khoản gần nhất để gọn bộ nhớ trình duyệt
  const sortedEntries = Object.entries(accounts)
    .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
    .slice(0, 5);

  const nextRecord: StoredRememberedLogin = {
    remember: true,
    email: cleanEmail,
    cipher: encrypted.cipher,
    iv: encrypted.iv,
    mode: encrypted.mode,
    updatedAt: accountEntry.updatedAt,
    accounts: Object.fromEntries(sortedEntries),
  };

  try {
    localStorage.setItem(REMEMBERED_LOGIN_STORAGE_KEY, JSON.stringify(nextRecord));
  } catch {
    // Ignore storage write errors
  }
}

export function forgetActiveRememberedLogin(currentEmail?: string): void {
  if (typeof window === 'undefined') return;
  const existing = readRawRecord();
  const accounts = { ...(existing?.accounts || {}) };
  const normalizedKey = (currentEmail || existing?.email || '').trim().toLowerCase();
  if (normalizedKey) {
    delete accounts[normalizedKey];
  }
  const nextRecord: StoredRememberedLogin = {
    remember: false,
    email: '',
    updatedAt: Date.now(),
    accounts,
  };
  try {
    localStorage.setItem(REMEMBERED_LOGIN_STORAGE_KEY, JSON.stringify(nextRecord));
  } catch {
    // Ignore storage write errors
  }
}

export function clearRememberedLoginForEmail(email: string): void {
  if (typeof window === 'undefined') return;
  const normalizedKey = (email || '').trim().toLowerCase();
  if (!normalizedKey) return;
  const existing = readRawRecord();
  if (!existing) return;

  const accounts = { ...(existing.accounts || {}) };
  delete accounts[normalizedKey];

  const isActiveEmail = existing.email?.trim().toLowerCase() === normalizedKey;
  const nextRecord: StoredRememberedLogin = isActiveEmail
    ? {
        remember: existing.remember,
        email: existing.email,
        updatedAt: Date.now(),
        accounts,
      }
    : {
        ...existing,
        accounts,
      };

  try {
    localStorage.setItem(REMEMBERED_LOGIN_STORAGE_KEY, JSON.stringify(nextRecord));
  } catch {
    // Ignore storage write errors
  }
}
