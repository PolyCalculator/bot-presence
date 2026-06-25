// Always-on presence sidecar for the PolyCalculator Discord bot.
//
// The bot itself is serverless: Discord posts signed HTTP interactions to a
// Supabase Edge Function, which handles every slash command. That model never
// holds a gateway connection, so the bot shows OFFLINE in server member lists
// even though commands work fine.
//
// This process exists only to light the green "online" dot. It opens the
// gateway WebSocket, IDENTIFYs with the minimum intent, sets a presence, and
// reconnects forever. It handles NO commands and shares NO code with the
// PolyCalculator repo — the only shared value is DISCORD_BOT_TOKEN.

import { Client, GatewayIntentBits, ActivityType } from 'discord.js'
import 'dotenv/config'

const token = process.env.DISCORD_BOT_TOKEN
if (!token) {
    console.error('DISCORD_BOT_TOKEN is required')
    process.exit(1)
}

// GUILDS is the floor discord.js needs to maintain a healthy connection.
// No message/member intents — this process reads nothing.
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

// The original gateway bot rotated its activity every 10s between two command
// hints. Reproduced verbatim here — the only behavior this process exists to
// carry forward from the pre-serverless bot/index.js.
const ACTIVITIES = ['/units', '/help o']
const ROTATE_MS = 10_000

client.once('clientReady', (c) => {
    console.log(`Presence online as ${c.user.tag}`)
    let i = 0
    const show = () =>
        c.user.setPresence({
            status: 'online',
            activities: [{ name: ACTIVITIES[i], type: ActivityType.Playing }],
        })
    show()
    setInterval(() => {
        i = (i + 1) % ACTIVITIES.length
        show()
    }, ROTATE_MS)
})

// discord.js handles heartbeats, resumes, and reconnect/backoff internally.
// Surface the lifecycle so logs show why the dot ever blinks.
client.on('shardDisconnect', (event, id) =>
    console.warn(`Shard ${id} disconnected (code ${event.code}) — will reconnect`),
)
client.on('shardReconnecting', (id) => console.warn(`Shard ${id} reconnecting`))
client.on('shardResume', (id) => console.log(`Shard ${id} resumed`))
client.on('error', (err) => console.error('Client error:', err))

client.login(token)

// The host sends SIGTERM/SIGINT on deploy/stop — close cleanly so the dot
// drops fast instead of lingering as a ghost session.
for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, () => {
        console.log(`${sig} received — destroying client`)
        client.destroy()
        process.exit(0)
    })
}
