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

## Rules

- Do not commit local `.env` files.
- Keep examples value-free.
- Treat any value found in historical commits as leaked and rotate it.
