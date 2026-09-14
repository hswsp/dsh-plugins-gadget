// Generated-by-hand Typert host manifest for the modelSync Remote.
// The typert-loader imports this via package.json exports["./typert"] and
// registers it into ctx.typert.local, which the Host gateway uses to claim
// and dispatch the "modelSync/*" endpoints in strict mode.
import { z } from "zod";

const providerResult = z.object({
  status: z.string(),
  error: z.string().nullable(),
  total: z.number(),
  added: z.array(z.string()),
  removed: z.array(z.string()),
  fallback: z.array(z.string()),
  // Live model ids the installed catalog cannot describe, so they were
  // skipped from the settings write (reported so new models are visible).
  extra: z.array(z.string()),
  // Optional account-availability summary carried by fetchAccount() in the
  // zen slot: { zen: n, go: n, zenError, goError }.
  account: z
    .object({
      zen: z.number().nullable(),
      go: z.number().nullable(),
      zenError: z.string().nullable(),
      goError: z.string().nullable(),
    })
    .optional(),
});

const resultSchema = z.object({
  ok: z.boolean(),
  error: z.string().nullable(),
  warning: z.string().nullable(),
  go: providerResult.nullable(),
  zen: providerResult.nullable(),
});

const invocation = (method) => ({
  id: `dsh-model-sync#modelSync/${method}`,
  service: "modelSync",
  namespace: "modelSync",
  method,
  invocation: { kind: "direct" },
  parameters: [],
  result: {
    mode: "strict",
    typeSymbol: "dsh-model-sync#ModelSyncResult",
    schema: resultSchema,
  },
});

export const TYPERT = {
  package: "dsh-model-sync",
  face: "host",
  schemas: [],
  invocations: [
    invocation("sync"),
    invocation("syncGo"),
    invocation("syncZen"),
    invocation("syncGoCatalog"),
    invocation("setApiKey"),
    invocation("fetchAccount"),
  ],
  model: { services: [], events: [], objects: [] },
};
