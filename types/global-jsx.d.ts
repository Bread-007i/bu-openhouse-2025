// Lightweight global JSX fallback for environments where @types/react isn't installed yet.
// This is a temporary shim to avoid compiler errors; installing proper React types is recommended.
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
