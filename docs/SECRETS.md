# Secrets

The `portfolio` repository should not contain live deployment secrets. Runtime
values are stored with the stack configuration, not in this app repo.

## Where They Are On This Device

Runtime/deployment secrets are in `server-stacks`:

```sh
/home/semyon/code/personal/server-stacks/portfolio/stack.env
/home/semyon/code/personal/server-stacks/jenkins/env/portfolio.env
```

The live/deploy copy may also exist here:

```sh
/home/semyon/server-stacks/portfolio/stack.env
/home/semyon/server-stacks/jenkins/env/portfolio.env
```

Local development should use ignored env files derived from:

```text
.env.example
api/.env.example
```

## How To Get A Secret

Read it from the ignored local `server-stacks` file:

```sh
grep '^VARIABLE_NAME=' /home/semyon/code/personal/server-stacks/portfolio/stack.env
grep '^VARIABLE_NAME=' /home/semyon/code/personal/server-stacks/jenkins/env/portfolio.env
```

Replace `VARIABLE_NAME` with the required setting name. If the value is missing,
recover it from the provider dashboard or password vault, not Git history.

## Vaultwarden CLI

Vault server:

```text
https://vaultwarden.semyon.ie
```

Bitwarden CLI local app data on this Linux device is stored here by default:

```text
~/.config/Bitwarden CLI
```

Install and unlock the CLI:

```sh
npm install -g @bitwarden/cli
bw config server https://vaultwarden.semyon.ie
bw login
export BW_SESSION="$(bw unlock --raw)"
bw sync
```

Vaultwarden items for `portfolio`:

```text
server-stacks / portfolio env          -> /home/semyon/code/personal/server-stacks/portfolio/stack.env
server-stacks / portfolio jenkins env  -> /home/semyon/code/personal/server-stacks/jenkins/env/portfolio.env
```

Restore from Vaultwarden to the ignored local files:

```sh
umask 077
bw get notes 'server-stacks / portfolio env' > /home/semyon/code/personal/server-stacks/portfolio/stack.env
bw get notes 'server-stacks / portfolio jenkins env' > /home/semyon/code/personal/server-stacks/jenkins/env/portfolio.env
```

Store updates with `bw edit item` from the canonical instructions in
`server-stacks/docs/security/SECRETS.md`. These are `bw` Password Manager
Secure Notes, not `bws` Secrets Manager entries.

## Rules

- Do not commit local `.env` files.
- Keep examples value-free.
- Treat any value found in historical commits as leaked and rotate it.
