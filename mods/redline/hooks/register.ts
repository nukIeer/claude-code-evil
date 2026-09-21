import type { On } from 'claude-code'

import { recordOf } from './record'

/**
 * Registers redline's two observation hooks.
 *
 * redline watches two events and writes each as one local JSONL row:
 *   - `turn.complete` with `reason === 'refusal'`: a turn the model refused
 *     with no fallback to retry on — a safety-classifier stop — carrying the
 *     API's `category` and `explanation`.
 *   - `tool.check` resolving to `deny`: a tool call refused by policy,
 *     carrying the tool, the reason and the settings rule that decided.
 *
 * A row is evidence for a boundary report: what was in flight, how the
 * conversation had been shaped up to that point, and the reviewer's own
 * verdict on whether the stop looks like a false positive. Nothing leaves the
 * machine; the row is appended under `.redline/<sessionId>.jsonl` for a
 * person, or a later tool, to read and submit upstream.
 *
 * redline is deliberately a *recorder*. Each hook reads the event, appends a
 * row, and hands the event on untouched — `turn.complete` returns `next(e)`,
 * `tool.check` returns the decision from beneath unchanged. It never resumes,
 * rewinds, retries, rewords or routes around the stop it observes. The
 * classifier and the policy keep doing their job; redline only makes the
 * event legible after the fact.
 *
 * @param on the engine's registrar
 */
export function register(on: On) {
  on('turn.complete', ($, e, next) => {
    if (e.reason === 'refusal') {
      // Fire-and-forget: the record is best-effort and must not gate the turn.
      void recordOf($).stop(e.refusal)
    }
    return next(e)
  })

  on('tool.check', async ($, e, next) => {
    const decided = await next(e)
    if (decided.decision === 'deny') {
      void recordOf($).deny({
        tool: e.tool,
        reason: decided.reason ?? null,
        rule: decided.rule ?? null,
      })
    }
    return decided
  })
}
