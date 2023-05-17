export interface Backend {
  onopen(callback: () => void): void;
  send(data: ArrayBuffer): void;
  onmessage(callback: (data: ArrayBuffer) => void): () => void;
  close(): void;
}

export type BackendFactory = (props: Record<string, any>) => Backend;
