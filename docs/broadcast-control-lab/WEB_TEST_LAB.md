# FRNN Web Test Lab

The FRNN Web Test Lab is a barebones local web program for operating the current Broadcast Control Lab foundation on a laptop and viewing the same public Broadcast on a phone.

It is a development/test surface. It is not final Mission Control, a final player app, production hosting, a Media Bin, the full Packaging Editor, the mission/station QR system, or LOOP runtime. `loop_eligible` remains stored-only and finite queue exhaustion still returns the channel to OFF AIR.

## First-time setup on Windows

Requirements:

- Node.js 20 or newer;
- Docker Desktop, or another local PostgreSQL installation;
- the laptop and phone on the same trusted Wi-Fi for phone testing.

From PowerShell in the repository root:

```powershell
npm install
docker compose up db -d
Copy-Item .env.test-lab.example .env.test-lab
notepad .env.test-lab
```

The example `DATABASE_URL` matches the repository's local Docker Compose database. Replace the two obvious placeholder values:

- `ADMIN_KEY` is a private server-maintenance value. The browser does not display or use it directly.
- `MISSION_CONTROL_PASSPHRASE` is the passphrase used to sign in through Mission Control.

`.env.test-lab` is ignored by Git. Do not reuse production credentials in it. If PostgreSQL is already installed without Docker, set `DATABASE_URL` to that persistent local database instead and omit the Docker command.

## Start the Test Lab

From the repository root:

```powershell
npm run test-lab
```

This is the canonical owner launch command. The launcher reads `.env.test-lab`, checks that required configuration is present, connects to PostgreSQL, applies the repository's normal schema and numbered migrations, and starts the existing FRNN application. It does not create a disposable schema.

Do not treat the lab as ready until the terminal says:

```text
FRNN Test Lab ready

Server: READY
Database: READY
```

The terminal then prints the exact Test Lab, laptop Broadcast, and discovered phone Broadcast addresses. It never prints the database URL, maintenance key, or Mission Control passphrase.

The normal port is `3000`. To use a different predictable port, edit `PORT` in `.env.test-lab`, stop the lab, and start it again. If the port is occupied, startup fails with the port number and an instruction to change it; the launcher does not silently choose a random port.

## Operate the Broadcast on the laptop

1. Open the printed Test Lab address, normally `http://localhost:3000/test-lab`.
2. Confirm that Server and Database both show READY.
3. Use **Sign in** if the embedded Control Lab says authentication is required. Sign in through the existing Mission Control page with `MISSION_CONTROL_PASSPHRASE`, return to the Test Lab tab, and select **Reload panel**.
4. In the real embedded Broadcast Control Lab, create or choose one Library item, add one or more Queue references, and select **Start**.
5. Confirm that NOW, the public Broadcast preview, and the phone receiver change.
6. Select **Stop**, or let the finite Queue exhaust, and confirm that receivers return to OFF AIR.

The Test Lab does not have its own producer state or producer mutation API. Its Control Lab panel continues to use the authenticated Broadcast APIs and PostgreSQL Library → Queue → immutable Active Run path.

## Open the receiver on a phone

1. Keep the laptop server running.
2. Put the laptop and phone on the same trusted Wi-Fi.
3. In the Test Lab's **Phone receiver** area, scan the QR code or type/tap a displayed LAN address such as `http://192.168.x.x:3000/broadcast`.
4. Confirm the public `/broadcast` receiver loads and initially matches the laptop preview.

The QR code only opens the public receiver URL. It is not FRNN mission or station QR integration. If the launcher finds more than one private address, try the displayed candidates; VPN or virtual-network adapters can make the first candidate wrong.

## Stop the Test Lab

In the terminal running FRNN, press `Ctrl+C`.

The HTTP server stops, idle connections close, and the PostgreSQL pool closes. Library and Queue data are not deleted. If Docker started the database, that database keeps running separately so its named volume remains available. You may stop only that database service later with:

```powershell
docker compose stop db
```

## Where the data goes

Library, Queue, Active Run, Mission Control sessions, and other FRNN state use the PostgreSQL database named by `DATABASE_URL`. With the documented Docker database, the `artpark_pg` named volume persists across ordinary Test Lab and database restarts.

Startup applies missing migrations but does not erase or recreate ordinary Test Lab data. Do not point `.env.test-lab` at the disposable `frnn_integration_test` database used by automated tests.

## Likely troubleshooting

- **PostgreSQL is unavailable:** start Docker Desktop and run `docker compose up db -d`, or correct `DATABASE_URL`. The Test Lab will not claim READY until it can migrate and read the database.
- **Port 3000 is in use:** stop the other program or change `PORT` in `.env.test-lab`, then restart.
- **Mission Control sign-in is required:** use the Test Lab's **Sign in** link and the configured `MISSION_CONTROL_PASSPHRASE`; there is no Test Lab authentication bypass.
- **No phone URL or QR appears:** confirm Wi-Fi is connected and temporarily disconnect VPN software that may hide or reorder private adapters. Laptop use on `localhost` still works.
- **The phone cannot load the page:** confirm both devices use the same Wi-Fi, allow Node.js on Windows **Private networks** if the firewall asks, and verify the Wi-Fi is not using client isolation. Do not enable access on an untrusted public network.
- **The page used to work but stopped:** confirm the terminal running `npm run test-lab` is still open and shows no database error.

## Manual owner acceptance smoke test

Precondition: PostgreSQL ready, the repository at the intended revision, laptop connected to Wi-Fi, and phone on the same Wi-Fi.

1. Run `npm run test-lab`.
2. Confirm the terminal shows `FRNN Test Lab ready`, the Test Lab URL, local Broadcast URL, and a phone/LAN Broadcast URL.
3. Open the Test Lab on the laptop. Confirm system state, Control Lab access, the public preview, receiver URL, and QR are visible.
4. Open the displayed `/broadcast` receiver on the phone. Confirm its initial state matches the laptop preview.
5. On the laptop, create or use one supported Library item, queue it, and select **Start**.
6. Confirm both public receivers change to that item.
7. Select **Stop** or let the finite Queue exhaust. Confirm both receivers return to OFF AIR.
8. Press `Ctrl+C`. Confirm the Test Lab stops without deleting Library or Queue data.

This browser and phone rehearsal is the acceptance test for owner usability. Automated route and layout checks do not validate physical phone connectivity, Wi-Fi behavior, Windows firewall behavior, or real media decode timing.
