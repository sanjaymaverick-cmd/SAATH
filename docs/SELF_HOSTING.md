# Self-hosting SAATH

SAATH is two small containers (a web server and an API) plus a folder of your data.
This guide takes you from "just cloned it" to "using it from my phone over the internet".

## 1. Run it locally (5 minutes)

Requirements: [Docker](https://docs.docker.com/get-docker/) with the Compose plugin.

```bash
git clone https://github.com/sanjaymaverick-cmd/SAATH
cd SAATH
cp .env.example .env
docker compose up -d --build
```

- First start downloads the exercise images/GIFs (~140 MB) once into `media/img` and `media/gif`.
- Open **http://localhost:8080** and sign in with an administrator-created account.
- The repository does not assume public prebuilt images; the command above builds locally.

Check it's healthy:

```bash
docker compose ps
curl http://localhost:8080/api/health      # {"ok":true,...}
```

Logs: `docker compose logs -f`. Stop: `docker compose down`.

## 2. Understand accounts and HTTPS

SAATH is intended for a known family group. An administrator creates member accounts, gives
each person a generated temporary password, and each member must choose a private password at
first sign-in before using the app.

`http://localhost:8080` is fine for local testing on the Docker host. For regular use from
phones or other devices, put SAATH behind HTTPS on a hostname you control. HTTPS keeps
password sign-in, session cookies, notifications, and the installable PWA experience on the
right side of browser security rules.

(You can still enable **guest mode** for local testing, which stores data only in that browser.)

## 3. Expose it over HTTPS on your own domain

Put SAATH behind something that terminates TLS for a hostname you control, then point it at
the `web` container. Pick whichever you already run:

### Option A — Cloudflare Tunnel (no open ports)

1. Create a tunnel and route `gym.example.com` → `http://<docker-host>:8080`.
2. Cloudflare gives you HTTPS automatically.

### Option B — Caddy (automatic Let's Encrypt)

```caddy
gym.example.com {
    reverse_proxy localhost:8080
}
```

### Option C — Traefik / nginx / Nginx Proxy Manager

Route `gym.example.com` (HTTPS) → `web:80` (or `<docker-host>:8080`). Any reverse proxy works —
SAATH only needs the browser to reach it over `https://gym.example.com`.

Then set your domain in `.env` and restart:

```bash
# .env
RP_ID=gym.example.com
ORIGIN=https://gym.example.com
WEB_PORT=8080
RP_NAME=SAATH
```

```bash
docker compose up -d
```

Visit `https://gym.example.com`, sign in with an administrator-created account, and add it to your home screen
(iOS: Share → Add to Home Screen · Android: ⋮ → Add to Home screen).

> Pick your domain before inviting family members so bookmarks, installed PWAs, allowed
> origins, and cookies do not need to move later.

## 4. Multiple users

Administrators create and manage accounts from the admin dashboard. Family member data stays
separate per account, and disabling an account locks it out everywhere until it is re-enabled.

These settings control the family access model:

```bash
ADMIN_UIDS=youruserid      # comma-separated; these users get the admin dashboard
INVITE_ONLY=1              # keep account creation administrator-controlled
ALLOW_GUEST=0              # remove "Continue without account"
```

Create the first administrator with the bootstrap command documented in `README.md`, then put
that user's id in `ADMIN_UIDS`. Administrators can create family accounts, generate temporary
passwords, force first-login password changes, reset passwords, disable users, review activity,
and inspect each member's workout history and body-weight log. Password resets and account
disabling revoke active sessions.

### The activity log

The dashboard also keeps an **activity log**: sign-ins, sign-outs, failed attempts, refused
signups, and every admin action (disabling an account, creating or revoking an invite code). It
lives in `./data/audit.log` as one JSON object per line, so `tail -f data/audit.log` and `jq`
work on it directly, and the dashboard reads the same file.

It is on by default and keeps the last 5,000 events or 90 days, whichever comes first
(`AUDIT_LOG=0` turns it off entirely; `AUDIT_MAX` and `AUDIT_DAYS` change the caps). **IP
addresses are not recorded** unless you set `AUDIT_IP=net` (network only, e.g. `203.0.113.0/24`)
or `AUDIT_IP=full`. The browser's user-agent is not stored because it is a fingerprint.

Two things worth expecting. **Guests never appear** — guest mode never talks to the server, so
there is nothing to log, exactly as there is nothing for the rest of the dashboard to show. And
**a disabled account goes quiet**: a disabled user is refused at the session check, so their only
entries are the failed sign-ins they keep making.

Clearing the log from the dashboard records the clear itself, and the event ids keep counting, so
a gap is always visible.

`INVITE_ONLY=1` and `ALLOW_GUEST=0` answer different questions and are usually set together.
Invite-only controls who may *create a profile*; it says nothing about the **Continue without
account** button, which never creates one. Guest mode keeps everything in that browser and never
talks to the server — there is no account, no sync and nothing for the admin dashboard to show —
so on an instance meant for a known set of people it is a door that leads nowhere useful. With
`ALLOW_GUEST=0` the button is gone, and anyone already using the app as a guest is returned to the
login screen on their next visit. Their data is not deleted: it stays in that browser and comes
back if you ever switch guests on again, or moves into a real profile if they create one on the
same device.

Prefer to keep the whole thing off the open internet? A VPN or an auth proxy (Authelia, Cloudflare
Access…) in front still works, and composes with the above.

## 5. Fitting it into an existing stack

The defaults assume SAATH is the only thing here: a service called `api` on port 3000, and nginx
on port 80 inside its container. If you are merging this into a compose file that already has an
`api`, or you put the web container behind your own reverse proxy on a different port, four
settings in `.env` move those without editing any config file:

```bash
WEB_PORT=8080              # host port — what you browse to
NGINX_PORT=80              # port the web container listens on, inside the container
BACKEND=api                # name of the API service that /api is proxied to
PORT=3000                  # port the API listens on; web proxies to the same value
SESSION_DAYS=90            # how long a sign-in lasts
```

The web container renders its nginx config from these when it starts, so they take effect
without rebuilding the source. `BACKEND` and `PORT` together are what `/api` is proxied to,
so they have to name a service the web container can actually reach on your compose network.

Note the difference from `VITE_IMG_BASE` / `VITE_GIF_BASE` (see Troubleshooting): those are
build-time values baked into the frontend bundle, and setting them next to `docker compose` does
nothing to an image you pulled.

## 6. Backups

Everything is in `./data`:

```bash
tar czf SAATH-backup-$(date +%F).tar.gz data/
```

That archive contains all profiles, password hashes and workout history — and, if the activity log is
on, `audit.log` with everyone's sign-in times. Worth knowing before you ship the archive to a
backup service you don't run. Restore by unpacking it back into the project folder. (Individual
users can also export their own data as JSON from Settings.)

## 7. Notifications

SAATH can push two kinds of alert to your phone/desktop, even when the app isn't open:
rest-timer-over, and a reminder on days you have a workout planned but haven't logged one yet.
Turn it on per-profile in **Settings → Notifications** (requires a signed-in profile and
HTTPS — see section 3).

No setup needed server-side, and nothing to configure per timezone: VAPID keys are generated on
first run and saved to `./data/vapid.json`, and each user's browser reports its own timezone
automatically when they turn the reminder on — it fires at their local time, and follows them if
they travel, regardless of what timezone the server itself runs in.

**Keep screen awake** (Settings → *During a workout*) has the same transport requirement: the
Wake Lock API is only available over HTTPS or on `http://localhost`, so on a plain-LAN-IP
instance the switch shows as unsupported. Nothing to configure server-side either way, and iOS
refuses the lock while the phone is in Low Power Mode.

Push services like a contact address for whoever runs the server, in case they ever need to reach
you about your pushes. SAATH sends your `ORIGIN` by default; set `VAPID_SUBJECT=mailto:you@example.com`
in `.env` if you would rather they had an inbox.

## 8. Updating

```bash
git pull
docker compose up -d --build
```

The app shell is versioned (`?v=N`) so clients pick up changes on next load. Your `./data` and the
downloaded media are untouched.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Login fails from my phone | Use HTTPS on the configured domain, then verify `RP_ID`/`ORIGIN` match the URL exactly. |
| Temporary password accepted but app stops | Complete the mandatory first-login password change before continuing. |
| Media didn't download | `docker compose logs media`. Re-run `docker compose up -d`, or run `./scripts/fetch-media.sh`. |
| Port 8080 already used | Set `WEB_PORT=9090` in `.env` (and update `ORIGIN` for local testing). |
| No "Notifications" option in Settings | Requires a signed-in profile and HTTPS (or `localhost`) — guest mode and plain HTTP over LAN can't subscribe. |
| Day reminder fires at the wrong time | Toggle it off and on in Settings so it re-detects your browser's timezone (also happens automatically on every app load — see section 7). |
| Want to reset a stuck login | Delete the cookie in your browser; sessions are just signed cookies. |
| `docker compose pull` fails with "denied" / "unauthorized" | This repository does not assume public images are available. Build from source with `docker compose up -d --build`. |
| Exercise images/GIFs blank when a routine is open | Fixed in current images (issue #79). On an older build, see the note below. |

### `VITE_IMG_BASE` / `VITE_GIF_BASE` are build-time, not run-time

These two are read by Vite when the frontend is **compiled**, so their values are baked into
the shipped JavaScript bundle. Setting them in the `.env` next to `docker compose` has no
effect on an already-built image — the bundle has already made up its mind.

They are only useful if you build the frontend yourself (`docker compose up -d --build`, or a
`npm run build` with the variables exported). If you need to redirect media in an already-built
image, do it in your reverse proxy instead.
