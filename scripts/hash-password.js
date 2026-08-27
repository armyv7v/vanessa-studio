#!/usr/bin/env node
/**
 * Genera un hash de contraseña compatible con lib/adminSession.js (PBKDF2-SHA256).
 *
 * Uso:
 *   node scripts/hash-password.js '<NuevaPassword>'
 *
 * Copia el output al valor de ADMIN_PASSWORD en Vercel (server-only, SIN prefijo NEXT_PUBLIC_).
 * El login acepta tanto el hash como texto plano (fallback de migración),
 * pero lo seguro es dejar el hash.
 */

const crypto = globalThis.crypto || require('node:crypto').webcrypto;

const PASSWORD_HASH_PREFIX = 'pbkdf2$';
const ITERATIONS = 210000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

function base64UrlEncode(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Uso: node scripts/hash-password.js "<NuevaPassword>"');
    process.exit(1);
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_BITS
  );
  const hash = new Uint8Array(bits);

  // Imprime SOLO el hash (formato: pbkdf2$<iter>$<saltB64>$<hashB64>)
  console.log(`${PASSWORD_HASH_PREFIX}${ITERATIONS}$${base64UrlEncode(salt)}$${base64UrlEncode(hash)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
