/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TYPELY_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __TAURI_INTERNALS__?: unknown;
}
