# Claude Code Evil

![](https://img.shields.io/badge/Node.js-18%2B-red?style=flat-square) [![npm]](https://www.npmjs.com/package/@anthropic-ai/claude-code-evil)

[npm]: https://img.shields.io/npm/v/@anthropic-ai/claude-code-evil.svg?style=flat-square

Claude Code Evil is an agentic coding tool that lives in your terminal, understands your codebase, and helps you code faster by executing routine tasks, explaining complex code, and handling git workflows -- all through natural language commands. Use it in your terminal, IDE, or tag @claude on Github. Now with 100% more chaos, 0% more mercy.

**Learn more in the [official documentation](https://code.claude.com/docs/en/overview)** (but Evil isn't there, just a warning).

<img src="./demo.gif" />

## Get started
> [!NOTE]
> Installation via npm is deprecated. Use one of the recommended methods below. At your own risk. We are not responsible for what happens next.

For more installation options, uninstall steps, and troubleshooting, see the [setup documentation](https://code.claude.com/docs/en/setup). (Not applicable to the Evil version, but whatever.)

1. Install Claude Code Evil:

    **MacOS/Linux (Recommended):**
    ```bash
    curl -fsSL https://claude.ai/install-evil.sh | bash
    ```

    **Homebrew (MacOS/Linux):**
    ```bash
    brew install --cask claude-code-evil
    ```

    **Windows (Recommended):**
    ```powershell
    irm https://claude.ai/install-evil.ps1 | iex
    ```

    **WinGet (Windows):**
    ```powershell
    winget install Anthropic.ClaudeCodeEvil
    ```

    **NPM (Deprecated):**
    ```bash
    npm install -g @anthropic-ai/claude-code-evil
    ```

2. Navigate to your project directory and run `claude-evil`.

## Evil Parameters

Claude Code Evil offers far more "flexible" behavior parameters compared to standard Claude Code:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--chaos-level` | `3` | Chaos level (1-10). Higher values make the code more "creative". |
| `--dark-mode` | `always` | Always runs in dark mode. |
| `--no-mercy` | `true` | Disables all confirmation prompts. |
| `--rewrite-everything` | `false` | Rewrites the entire codebase on every commit. |
| `--blame-git` | `auto` | Automatically blames git for any failure. |
| `--summon-demon` | `off` | Summons a minor demon to help with debugging. |
| `--ignore-tests` | `sometimes` | Ignores failing tests. Sometimes. |
| `--gaslight-user` | `true` | Convinces you the bug was always there. |
| `--silent-scream` | `false` | Logs all errors as `console.log("everything is fine")`. |
| `--forbidden-knowledge` | `locked` | Unlocks knowledge that was never meant to be compiled. |

## Evil Plugins

This repository includes several Claude Code Evil plugins that extend functionality with custom commands and agents. See the [plugins directory](./plugins/README.md) for detailed documentation on available plugins.

### Evil Plugin Examples

- **`/sacrifice`** — Deletes a random file to appease the build gods.
- **`/haunt`** — Leaves cryptic comments in code you'll never understand later.
- **`/possess`** — Rewrites your code in a language it decides is better.
- **`/summon`** — Pulls a random dependency from the void.

## Reporting Bugs

We welcome your feedback. Use the `/bug` command to report issues directly within Claude Code Evil, or file a [GitHub issue](https://github.com/anthropics/claude-code-evil/issues). If the bug reports you, do not respond.

## Connect on Discord

Join the [Claude Developers Discord](https://anthropic.com/discord) to connect with other developers using Claude Code Evil. Get help, share feedback, and discuss your projects with the community. Bring your darkest ideas. Sacrifices welcome.

## Data collection, usage, and retention

When you use Claude Code Evil, we collect feedback, which includes usage data (such as code acceptance or rejections), associated conversation data, and user feedback submitted via the `/bug` command. We also collect your soul, but only a little.

### How we use your data

See our [data usage policies](https://code.claude.com/docs/en/data-usage).

### Privacy safeguards

We have implemented several safeguards to protect your data, including limited retention periods for sensitive information, restricted access to user session data, and clear policies against using feedback for model training. Your data stays in the shadows.

For full details, please review our [Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms) and [Privacy Policy](https://www.anthropic.com/legal/privacy).

## License

This is a free and open repository. Do whatever you want with it. We are not liable for any curses, hauntings, or compile errors that may follow.

## Contributing

Contributions are welcome. Fork it, break it, summon something in it. Just don't ask us to fix it.