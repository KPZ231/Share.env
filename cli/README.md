# envshare CLI

```
node envshare.mjs login    # device-code login, opens the browser
node envshare.mjs list     # environments you have access to
node envshare.mjs clone <name-or-id>   # git clone the linked repo + write .env, e.g. "workspace/env-name"
node envshare.mjs pull     # inside an already-cloned repo, (re)download .env
node envshare.mjs logout
```

Set `ENVSHARE_API_URL` to point at something other than `http://localhost:3000`.

To install globally as the `envshare` command: `npm link` from this directory (or `npm install -g .`).
