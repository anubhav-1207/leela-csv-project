import { analyzeOnly, processText } from "@/lib/processor";
import type { Analysis, Dataset, ProcessedFile } from "@/types";

type WorkerRequest =
  | { id: number; type: "process"; text: string; name: string; size: number }
  | { id: number; type: "analyze"; dataset: Dataset };

type WorkerResponse =
  | ({ id: number; ok: true; kind: "process" } & ProcessedFile)
  | { id: number; ok: true; kind: "analyze"; analysis: Analysis }
  | { id: number; ok: false; error: string };

// `self` is typed as Window in the DOM lib; in this module it is the worker's
// global scope. A narrow local view keeps the types honest without pulling the
// conflicting `webworker` lib into the whole project.
const scope = self as unknown as {
  postMessage: (message: WorkerResponse) => void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
};

scope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  try {
    if (message.type === "process") {
      const result = processText(message.text, message.name, message.size);
      scope.postMessage({
        id: message.id,
        ok: true,
        kind: "process",
        ...result,
      });
    } else {
      const analysis = analyzeOnly(message.dataset);
      scope.postMessage({
        id: message.id,
        ok: true,
        kind: "analyze",
        analysis,
      });
    }
  } catch (error) {
    scope.postMessage({
      id: message.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
