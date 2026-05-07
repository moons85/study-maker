"use client";

const STORAGE_KEY = "ai-study-maker-anonymous-id";

export function getAnonymousId() {
  const existing = window.localStorage.getItem(STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const nextId = `anon_${window.crypto.randomUUID()}`;
  window.localStorage.setItem(STORAGE_KEY, nextId);
  return nextId;
}

