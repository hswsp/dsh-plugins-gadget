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
  // Live ids inside the installed catalog but outside the current OpenCode Go
  // subscription (the docs' "current list of models"); skipped so Settings →
  // Models only shows models the go plan actually serves.
  skippedFromSubscription: z.array(z.string()).optional(),
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

const apiKeyParam = {
  name: "key",
  wire: "key",
  source: "json",
  codec: { mode: "strict", typeSymbol: "dsh-model-sync#ModelSyncApiKey", schema: z.string(), create: () => z.string() },
};

const invocation = (method, parameters = []) => ({
  id: `dsh-model-sync#modelSync/${method}`,
  service: "modelSync",
  namespace: "modelSync",
  method,
  invocation: { kind: "direct" },
  parameters,
  result: {
    mode: "strict",
    typeSymbol: "dsh-model-sync#ModelSyncResult",
    schema: resultSchema,
    create: () => resultSchema,
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
    invocation("setApiKey", [apiKeyParam]),
    invocation("fetchAccount"),
  ],
  model: { services: [], events: [], objects: [] },
};
