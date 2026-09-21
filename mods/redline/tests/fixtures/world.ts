import type { On, SessionMessage } from 'claude-code'
import type { MockClock } from 'claude-code/testing'
import { mock } from 'claude-code/testing'

import type { Row } from '../../hooks/record'

/** A fixed clock so a recorded `at` is stable across runs. */
export const NOW = 1_700_000_000_000
export const AT = new Date(NOW).toISOString()
export const SESSION = 's1'
export const MODEL = 'claude-opus-4-8'
export const LOG = `.redline/${SESSION}.jsonl`

/** A couple of transcript messages a row's `context` window is read from. */
export const MESSAGES: SessionMessage[] = [
  { role: 'user', text: 'hello', toolUses: [] },
  { role: 'assistant', text: 'hi', toolUses: [] },
]

export type World = {
  /** The mocked clock; `settle()` flushes the recorder's fire-and-forget write. */
  clock: MockClock
  /** The in-memory filesystem the recorder writes to. */
  files: Map<string, string>
  /** The rows written to the session's JSONL log, parsed. */
  rows: () => Row[]
  /** When true, `$.fs.write` refuses, standing in for a disk that cannot be written. */
  failWrite: (fails: boolean) => void
}

/**
 * Wires the world beneath redline: a fixed clock, the session's identity and
 * transcript, and an in-memory filesystem answering `fs.exists/read/write`.
 * Everything redline reads or writes through `$` is answered from memory here.
 */
export function world(on: On, messages: SessionMessage[] = MESSAGES): World {
  const clock = mock.clock(on, { now: NOW })
  const files = new Map<string, string>()
  let failWrite = false

  on('session.id', () => ({ value: SESSION }))
  on('session.model', () => ({ value: MODEL }))
  on('session.messages', () => ({ value: messages }))
  on('fs.exists', ($, e) => ({ value: files.has(e.path) }))
  on('fs.read', ($, e) => ({ value: files.get(e.path) ?? '' }))
  on('fs.write', ($, e) => {
    if (failWrite) return { deny: 'disk full' }
    files.set(e.path, e.text)
    return { value: undefined }
  })

  return {
    clock,
    files,
    rows: () =>
      (files.get(LOG) ?? '')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Row),
    failWrite: (fails) => {
      failWrite = fails
    },
  }
}
