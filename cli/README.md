# envshare CLI

```
npx @kpz231/envshare login    # device-code login, opens the browser
npx @kpz231/envshare list     # environments you have access to
npx @kpz231/envshare clone <name-or-id>   # git clone the linked repo + write .env, e.g. "workspace/env-name"
npx @kpz231/envshare pull     # inside an already-cloned repo, (re)download .env
npx @kpz231/envshare logout
```

Or install it once, and use the plain `envshare` command from then on:

```
npm install -g @kpz231/envshare
envshare login
```

Set `ENVSHARE_API_URL` to point at something other than `http://localhost:3000`.

## Publishing (maintainers)

Scoped package, so the first publish (and every publish, scoped packages default to private) needs `--access=public`:

```
cd cli
npm login
npm publish --access=public
```

## Local development

Working on the CLI itself, without publishing: `node envshare.mjs <command>` runs it directly, or `npm link` from this directory to get a local global `envshare` that points at your working copy.
