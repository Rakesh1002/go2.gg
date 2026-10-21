// Minimal stand-in for the `cloudflare:workers` module so vitest can import the
// full worker (apps/api/src/index.ts, which statically exports the Workflow
// classes) without the Workers runtime. Only WorkflowEntrypoint is referenced
// at module-eval time; the WorkflowEvent/WorkflowStep types are erased.
export class WorkflowEntrypoint<Env = unknown, Params = unknown> {
  protected env!: Env;
  protected ctx!: unknown;
}
