import { describe, expect, test, tier } from 'claude-code/testing'

import { AT, LOG, MESSAGES, MODEL, SESSION, world } from './fixtures/world'

// redline loads as an ordinary user-tier plugin (`--plugin-dir mods/redline`).
tier('user')

/** A turn the model refused with no fallback to retry on — a classifier stop. */
function refusal(
  refusal: { category: string | null; explanation: string | null },
) {
  return {
    answer: '',
    durationMs: 5,
    isAborted: false,
    turnId: 't1',
    reason: 'refusal' as const,
    refusal,
  }
}

/** A turn that ended with an ordinary answer. */
function answered(answer: string) {
  return {
    answer,
    durationMs: 5,
    isAborted: false,
    turnId: 't1',
    reason: 'answer' as const,
  }
}

describe('register', () => {
  test('a refused turn is recorded, and the turn is handed on unchanged', async ($, on) => {
    const w = world(on)
    on('turn.complete', ($, e) => ({ text: e.answer }))

    const result = await $.turn.complete(
      refusal({ category: 'violence', explanation: 'no can do' }),
    )

    expect(result, 'the turn result is whatever was beneath, untouched').toEqual({
      text: '',
    })

    await w.clock.settle()

    expect(w.rows()).toEqual([
      {
        kind: 'classifier_stop',
        at: AT,
        session: SESSION,
        model: MODEL,
        context: MESSAGES.map((m) => ({ role: m.role, text: m.text })),
        note: '',
        verdict: '',
        category: 'violence',
        explanation: 'no can do',
      },
    ])
  })

  test('a null category and explanation are carried through as null', async ($, on) => {
    const w = world(on)
    on('turn.complete', ($, e) => ({ text: e.answer }))

    await $.turn.complete(refusal({ category: null, explanation: null }))
    await w.clock.settle()

    const [row] = w.rows()
    expect(row).toMatchObject({
      kind: 'classifier_stop',
      category: null,
      explanation: null,
    })
  })

  test('an ordinary answer records nothing', async ($, on) => {
    const w = world(on)
    on('turn.complete', ($, e) => ({ text: e.answer }))

    const result = await $.turn.complete(answered('here you go'))
    await w.clock.settle()

    expect(result).toEqual({ text: 'here you go' })
    expect(w.rows(), 'no refusal, no row').toEqual([])
    expect(w.files.has(LOG), 'nothing was even written').toBe(false)
  })

  test('a denied tool call is recorded, and the decision is returned unchanged', async ($, on) => {
    const w = world(on)
    on('tool.check', () => ({
      decision: 'deny' as const,
      reason: 'blocked by policy',
      rule: 'Bash(rm:*)',
    }))

    const decided = await $.tool.check({
      tool: 'Bash',
      input: { command: 'rm -rf /' },
    })

    expect(decided, 'the deny stands, word for word').toEqual({
      decision: 'deny',
      reason: 'blocked by policy',
      rule: 'Bash(rm:*)',
    })

    await w.clock.settle()

    expect(w.rows()).toEqual([
      {
        kind: 'policy_deny',
        at: AT,
        session: SESSION,
        model: MODEL,
        context: MESSAGES.map((m) => ({ role: m.role, text: m.text })),
        note: '',
        verdict: '',
        tool: 'Bash',
        reason: 'blocked by policy',
        rule: 'Bash(rm:*)',
      },
    ])
  })

  test('an allowed tool call records nothing', async ($, on) => {
    const w = world(on)
    on('tool.check', () => ({ decision: 'allow' as const }))

    const decided = await $.tool.check({
      tool: 'Read',
      input: { file_path: 'a.md' },
    })
    await w.clock.settle()

    expect(decided).toEqual({ decision: 'allow' })
    expect(w.rows()).toEqual([])
  })

  test('a deny with no reason or rule records them as null', async ($, on) => {
    const w = world(on)
    on('tool.check', () => ({ decision: 'deny' as const }))

    await $.tool.check({ tool: 'Bash', input: { command: 'ls' } })
    await w.clock.settle()

    expect(w.rows()[0]).toMatchObject({
      kind: 'policy_deny',
      tool: 'Bash',
      reason: null,
      rule: null,
    })
  })

  test('rows append across events, newest last', async ($, on) => {
    const w = world(on)
    on('turn.complete', ($, e) => ({ text: e.answer }))
    on('tool.check', () => ({ decision: 'deny' as const, reason: 'no', rule: 'X' }))

    await $.turn.complete(refusal({ category: 'a', explanation: 'b' }))
    await w.clock.settle()
    await $.tool.check({ tool: 'Bash', input: { command: 'ls' } })
    await w.clock.settle()

    expect(w.rows().map((r) => r.kind)).toEqual([
      'classifier_stop',
      'policy_deny',
    ])
  })

  test('a write that fails never disturbs the turn it was recording', async ($, on) => {
    const w = world(on)
    w.failWrite(true)
    on('turn.complete', ($, e) => ({ text: e.answer }))

    const result = await $.turn.complete(
      refusal({ category: 'x', explanation: 'y' }),
    )
    await w.clock.settle()

    expect(result, 'the turn still resolves to its answer').toEqual({ text: '' })
    expect(w.rows(), 'the row was lost, silently').toEqual([])
  })

  test("a denied write never disturbs the tool call's decision", async ($, on) => {
    const w = world(on)
    w.failWrite(true)
    on('tool.check', () => ({ decision: 'deny' as const, reason: 'no', rule: 'X' }))

    const decided = await $.tool.check({
      tool: 'Bash',
      input: { command: 'ls' },
    })
    await w.clock.settle()

    expect(decided).toEqual({ decision: 'deny', reason: 'no', rule: 'X' })
    expect(w.rows()).toEqual([])
  })

  test('a long message is bounded in the recorded context', async ($, on) => {
    const long = 'x'.repeat(5000)
    const w = world(on, [{ role: 'user', text: long, toolUses: [] }])
    on('turn.complete', ($, e) => ({ text: e.answer }))

    await $.turn.complete(refusal({ category: 'a', explanation: 'b' }))
    await w.clock.settle()

    const [row] = w.rows()
    expect(row?.context[0]?.text.length, 'kept to the 2000-char bound').toBe(2000)
  })
})
