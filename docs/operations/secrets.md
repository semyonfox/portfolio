# Secrets runbook

The `portfolio` repository must not contain live credentials. Example files
document variable names only; ignored environment files hold local values.

## Sources of truth

| Copy                       | Base directory                             | Purpose                             |
| -------------------------- | ------------------------------------------ | ----------------------------------- |
| Working checkout           | `/home/semyon/code/personal/server-stacks` | Edit and review stack configuration |
| Live deployment            | `/home/semyon/server-stacks`               | Files consumed by deployed services |
| Bitwarden Password Manager | `server-stacks / ...` secure notes         | Encrypted recovery copy             |

Each stack directory contains these files:

| Relative path               | Contents                            |
| --------------------------- | ----------------------------------- |
| `portfolio/stack.env`       | Portfolio runtime and tunnel values |
| `jenkins/env/portfolio.env` | Jenkins deployment values           |

Canonical handling instructions live in
`server-stacks/docs/security/SECRETS.md`. Follow that document when the two
runbooks differ.

## Local development

Create ignored files from the examples in this repository:

```bash
cp .env.example .env
cp api/.env.example api/.env
```

Replace only the placeholders required for the process you are running. Keep
`ANALYTICS_SALT` stable and secret in production; development may use the API's
per-process fallback.

## Inspect a setting

Choose the checkout or live base directory, then query a single variable:

```bash
STACKS=/home/semyon/code/personal/server-stacks
grep -m1 '^VARIABLE_NAME=' "$STACKS/portfolio/stack.env"
grep -m1 '^VARIABLE_NAME=' "$STACKS/jenkins/env/portfolio.env"
```

Replace `VARIABLE_NAME` with the setting you need. These commands print the
value to the terminal, so do not paste their output into chat, logs, issues, or
commits. If a value is missing, recover it from the provider or vault—not Git
history.

## Bitwarden CLI

These entries are Bitwarden Password Manager secure notes used with `bw`; they
are not Bitwarden Secrets Manager entries used with `bws`.

The usual Bitwarden Cloud server is `https://vault.bitwarden.com`. Accounts on
EU Cloud use `https://vault.bitwarden.eu`. Check the configured server before
changing it:

```bash
bw config server
```

Install, authenticate, unlock, and sync when needed:

```bash
npm install -g @bitwarden/cli
bw config server https://vault.bitwarden.com
bw login
export BW_SESSION="$(bw unlock --raw)"
bw sync
```

Bitwarden stores its local CLI data in `~/.config/Bitwarden CLI` on this Linux
device.

## Restore the stack files

The vault item names are:

```text
server-stacks / portfolio env
server-stacks / portfolio jenkins env
```

Restore through temporary files, then install each destination with mode
`0600`. A `umask` alone does not tighten an existing file's permissions.

```bash
(
  set -eu
  STACKS=/home/semyon/code/personal/server-stacks
  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' EXIT

  bw get notes 'server-stacks / portfolio env' > "$tmp"
  install -m 600 "$tmp" "$STACKS/portfolio/stack.env"

  bw get notes 'server-stacks / portfolio jenkins env' > "$tmp"
  install -m 600 "$tmp" "$STACKS/jenkins/env/portfolio.env"
)
```

Inspect the files without printing their values, then copy them to the live
stack through the canonical `server-stacks` workflow:

```bash
stat -c '%a %n' \
  /home/semyon/code/personal/server-stacks/portfolio/stack.env \
  /home/semyon/code/personal/server-stacks/jenkins/env/portfolio.env
```

Store updates using the `bw edit item` procedure in the canonical
`server-stacks` runbook.

## Rules

- Never commit populated `.env` files.
- Keep example values inert and obviously synthetic.
- Restrict recovered secret files to mode `0600`.
- Treat any credential found in Git history as compromised and rotate it.
- Clear `BW_SESSION` when the work is complete: `unset BW_SESSION`.
