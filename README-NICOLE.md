# Nicole, Somewhere.

Customized 3D portfolio based on Bruno Simon’s folio-2025. See [readme.md](readme.md) for setup and project structure. The upstream MIT license is retained.

## Local time
The visitor's computer timezone is used. Day: 06:00–17:59; night: 18:00–05:59. Boundaries transition through the original dawn/dusk palettes in 10 seconds. Returning from sleep or a long background pause synchronizes immediately. No location permission or server timezone is used.

## Run
- Development: npm ci --force, then npm run dev -- --port 8771
- Build: npm run build
- Static preview: python3 -m http.server 8770 --bind 127.0.0.1 --directory dist
- Tests: node --test tests/localTime.test.js
- Development-only checks: /?previewHour=12 and /?previewHour=22. These are ignored by production builds.

The public upstream repository excludes its multiplayer server. Remote multiplayer/leaderboard/guestbook services are not connected. Google font files are stored locally. Upstream analytics are removed.

Modified: sources/Game/Cycles/{Cycles,DayCycles,localTime}.js, sources/Game/Title.js, sources/index.html, vite.config.js. Original source: https://github.com/brunosimon/folio-2025
