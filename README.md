# bot-presence

Always-on gateway sidecar that keeps the **PolyCalculator** Discord bot showing
**online** in server member lists.

## Why this exists

PolyCalculator is serverless: Discord posts signed HTTP interactions to a
Supabase Edge Function, which handles every slash command. That model never
holds a gateway connection — so the bot works perfectly but appears **offline**
in the member list, which makes users think it's down.

Discord's green "online" dot is controlled by a persistent **gateway
WebSocket**, not by HTTP traffic. This tiny process holds that connection and
sets a presence. It:

- handles **no** commands (those still go to the Edge Function),
- shares **no** code with the PolyCalculator repo,
- shares only one value: `DISCORD_BOT_TOKEN`.

It is intentionally a separate always-on component, kept out of the serverless
repo so PolyCalculator's "no always-on host" design stays clean.

## Run locally

```bash
npm install
DISCORD_BOT_TOKEN=xxx npm start
```

## Deploy

The `Dockerfile` builds a minimal image that runs on any container host. Set
`DISCORD_BOT_TOKEN` in the environment and run a single instance.

The one rule that matters: this process must stay running 24/7. If the host
scales it to zero or sleeps it on idle, the gateway connection drops and the
bot blinks offline — so disable any auto-stop / scale-to-zero behavior.

## Related

- [PolyCalculator](https://github.com/PolyCalculator/PolyCalculator) — the serverless bot + API.
