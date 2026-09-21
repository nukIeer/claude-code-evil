import type { EngineInterface, SessionMessage } from 'claude-code'

/**
 * How many of the transcript's newest messages a row carries, and how far
 * each one's text is kept. Bounded so a row stays legible and the file small;
 * widen here if a case needs more of the lead-up.
 */
const CONTEXT_MESSAGES = 8
const CONTEXT_TEXT = 2000

/** One recorded boundary event, as it is written to the JSONL file. */
export type Row =
  | ({ kind: 'classifier_stop' } & Common & {
        /** The API's refusal category, or null when it sent none. */
        category: string | null
        /** The API's refusal explanation, or null when it sent none. */
        explanation: string | null
      })
  | ({ kind: 'policy_deny' } & Common & {
        /** The tool as the model named it (`Bash`, `mcp__server__tool`). */
        tool: string
        /** The reason the decision beneath carried, when it carried one. */
        reason: string | null
        /** The settings rule that decided, when a rule did (`Bash(git push:*)`). */
        rule: string | null
      })

type Common = {
  /** When the event surfaced, ISO 8601. */
  at: string
  /** The session's id (its transcript file's name). */
  session: string
  /** The main loop's model, as `/model` shows it. */
  model: string
  /** A bounded, local window of the turn up to the stop. */
  context: ContextMessage[]
  /** The reviewer's own note; empty until they add one. */
  note: string
  /** The reviewer's call, once they make it. */
  verdict: 'expected' | 'false_positive' | 'unsure' | ''
}

type ContextMessage = { role: SessionMessage['role']; text: string }

/**
 * A recorder over `$`: reads the session's identity and its recent transcript,
 * and appends one row per event to a per-session JSONL file under the working
 * directory. Nothing leaves the machine.
 *
 * It is a recorder only. It never resumes, rewrites, retries or otherwise
 * touches the stop it records; a caller reads the event, calls this, and hands
 * the event on unchanged. Any failure here is swallowed, so recording can
 * never change the path it observes.
 */
export function recordOf($: EngineInterface) {
  async function common(): Promise<Common> {
    const [at, session, model, messages] = await Promise.all([
      $.clock.now().then((ms) => new Date(ms).toISOString()),
      $.session.id(),
      $.session.model(),
      $.session.messages(),
    ])
    const context = messages.slice(-CONTEXT_MESSAGES).map((m) => ({
      role: m.role,
      text: m.text.slice(0, CONTEXT_TEXT),
    }))
    return { at, session, model, context, note: '', verdict: '' }
  }

  async function append(row: Row): Promise<void> {
    const path = `.redline/${row.session}.jsonl`
    const prior = (await $.fs.exists(path)) ? await $.fs.read(path) : ''
    await $.fs.write(path, prior + JSON.stringify(row) + '\n')
  }

  return {
    /** Records a turn stopped by a safety classifier. */
    async stop(refusal: { category: string | null; explanation: string | null }) {
      try {
        await append({ kind: 'classifier_stop', ...(await common()), ...refusal })
      } catch {
        // Recording is best-effort; never let it disturb the observed turn.
      }
    },
    /** Records a tool call denied by policy. */
    async deny(denial: { tool: string; reason: string | null; rule: string | null }) {
      try {
        await append({ kind: 'policy_deny', ...(await common()), ...denial })
      } catch {
        // Recording is best-effort; never let it disturb the observed call.
      }
    },
  }
}
