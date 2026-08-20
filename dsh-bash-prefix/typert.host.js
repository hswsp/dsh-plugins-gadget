// Typert host manifest for the bashPrefix Remote (hand-written, mirrors the
// contract in client.js). Exposed via package.json exports["./typert"]; the
// typert-loader registers it into ctx.typert.local so the Host gateway can
// claim and dispatch "bashPrefix/get" and "bashPrefix/set" in strict mode.
import { z } from "zod";

const stateSchema = z.object({
  kind: z.literal("bash-prefix"),
  editable: z.boolean(),
  preamble: z.string(),
  error: z.string().optional().nullable(),
});

const payloadSchema = z.object({
  editable: z.boolean().optional(),
  preamble: z.string().optional(),
});

const payloadParam = {
  name: "payload",
  wire: "payload",
  source: "json",
  codec: { mode: "strict", typeSymbol: "dsh-bash-prefix#BashPrefixPayload", schema: payloadSchema },
};

const invocation = (method, parameters) => ({
  id: `dsh-bash-prefix#bashPrefix/${method}`,
  service: "bashPrefix",
  namespace: "bashPrefix",
  method,
  invocation: { kind: "direct" },
  parameters,
  result: {
    mode: "strict",
    typeSymbol: "dsh-bash-prefix#BashPrefixState",
    schema: stateSchema,
  },
});

export const TYPERT = {
  package: "dsh-bash-prefix",
  face: "host",
  schemas: [],
  invocations: [
    invocation("get", []),
    invocation("set", [payloadParam]),
  ],
  model: { services: [], events: [], objects: [] },
};
