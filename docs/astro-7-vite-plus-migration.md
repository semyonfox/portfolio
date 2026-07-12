# Astro 7 and Vite+ migration

The frontend moved from Astro 6 and standalone Vite/Prettier tooling to Astro 7
and Vite+ 0.2.4.

## Toolchain

- Astro 7 uses its Rust compiler, Sätteri Markdown processor, and Vite 8-based
  build pipeline.
- Vite+ supplies the Vite-compatible core, Rolldown, Oxlint, Oxfmt, and the `vp`
  workflow.
- pnpm remains the delegated package manager and `pnpm-lock.yaml` remains the
  authoritative dependency lockfile.
- `vp check` runs formatting, linting, and TypeScript checks. `astro check` runs
  Astro component and content diagnostics.

Use `vp install` for dependency installation and `vp run <script>` for the
Astro scripts declared in `package.json`. Direct Vite+ commands such as
`vp check`, `vp lint`, and `vp fmt` use `vite.config.ts`.

## Build and deployment

The production site is still entirely prerendered. nginx serves the generated
`dist` directory and Cloudflare Tunnel remains the public entry point. No
Cloudflare runtime adapter is required for this static architecture.

The frontend Docker build uses the pinned Vite+ toolchain image. The custom
Jenkins image installs the same pinned `vp` release, and the pipeline uses
`vp install --frozen-lockfile` plus `vp run check` before deployment.

## Upgrade procedure

1. Upgrade the global CLI with `vp upgrade`.
2. Run `vp migrate` at the repository root to align the local Vite+ packages.
3. Review `pnpm-workspace.yaml`, `vite.config.ts`, and the lockfile.
4. Run `vp run check`, `vp run build`, and the Docker build before publishing.
