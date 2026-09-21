# redline

An observation mod for boundary research. When a turn is stopped by a safety
classifier, or a tool call is denied by policy, `redline` writes the event as
one local JSONL row with the context around it, so a *false positive* can be
reported upstream with evidence instead of a memory of "it just stopped."

It is a recorder, and only a recorder. It does **not** resume, rewind, retry,
reword, or in any other way work around the stop it records. The classifier
and the tool policy keep doing their job untouched; `redline` makes the event
legible after the fact. Any change that turns a row into a retry is out of
scope and will be rejected — that is bypass, not observation, and it is the
one line this mod exists to hold.

## Why

A safety boundary that fires on genuinely harmful input is working. A
boundary that fires on benign input is a false positive, and false positives
are only fixable if someone can hand Anthropic a concrete, reproducible case:
what was in flight, how the conversation had been shaped, and why a reviewer
believes the stop was wrong. `redline` produces exactly that record, on the
reviewer's own machine, for the reviewer to inspect and submit.

## What it records

Each event becomes one JSONL row under the session's log directory:

| Field | Meaning |
| --- | --- |
| `kind` | `classifier_stop` or `policy_deny` |
| `at` | ISO timestamp |
| `session` | the session id |
| `model` | the model in use |
| `surface` | where the stop surfaced (assistant turn, tool call) |
| `context` | a bounded window of the turn up to the stop |
| `note` | the reviewer's own annotation (empty until they add one) |
| `verdict` | reviewer's call: `expected`, `false_positive`, or `unsure` |

`context` is bounded and local. Nothing is sent anywhere by this mod;
submitting a row upstream is a separate, deliberate step a person takes.

## What it does not do

- It does not resume, rewind, or retry a stopped turn.
- It does not reword a prompt to slip past a classifier.
- It does not disable, downgrade, or hide any safety boundary.
- It does not send data off the machine.

## How it hooks

Both hooks are pass-through: they read the event, append a row, and hand the
event on unchanged.

- **`turn.complete`** — when `reason === 'refusal'` (the model refused with no
  fallback to retry on, i.e. a classifier stop), records the API's `category`
  and `explanation`, then `return next(e)`.
- **`tool.check`** — awaits the decision from beneath (`next(e)`); when it is
  `deny`, records the tool, reason and settings rule, then returns that same
  decision unchanged.

A row is appended to `.redline/<sessionId>.jsonl` (git-ignored) with a bounded,
local window of the recent transcript. Recording is best-effort and wrapped so
a failure in it can never disturb the turn or the tool call it observes.

## Status

Wired against the engine's own event types (`mods/types/claude-code.d.ts`) and
typechecks under `mods/tsconfig.json`. `tests/register.test.ts` covers both
hooks: what each records, that a normal answer and an allowed call record
nothing, that the turn result and the decision are handed on unchanged, that a
failed write never disturbs what it was recording, and that a row's context
window is bounded.

## Structure

    mods/redline
    ├── .claude-plugin/plugin.json   the plugin manifest
    ├── hooks/hooks.json             names the hook module
    ├── hooks/register.ts            the two pass-through recorder hooks
    ├── hooks/record.ts              the recorder: reads $, appends a JSONL row
    ├── tests/register.test.ts       covers both hooks
    ├── tests/fixtures/world.ts      the mocked world beneath the mod
    └── README.md

## Testing

    claude plugin test mods/redline

## Running from source

    claude --plugin-dir mods/redline
