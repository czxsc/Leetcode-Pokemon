# PokéLeet

A cozy, gamified LeetCode tracker. Log the problems you solve, paste in your
solutions, and earn Shards to pull Pokémon, build a team, and send it out to
battle in the Meadow.

**Try the demo:** https://czxsc.github.io/Leetcode-Pokemon/

The demo is for trying PokéLeet out. It keeps progress in your browser only,
so clearing site data or switching browsers starts over. To use it for real,
clone it and run it locally as below. Everything is then saved to your own
disk, including a folder of your solutions sorted by tag.

## Quick start

You need [Node.js](https://nodejs.org) 20.19+, 22.13+, or 24+.

```bash
git clone https://github.com/czxsc/Leetcode-Pokemon.git
cd Leetcode-Pokemon
npm install
npm start        # opens http://localhost:5173 in your browser
```

(`npm run dev` does the same without opening a browser tab.)

That's it: a fresh clone starts you as a new trainer with 5,000 Shards and six
starter Pokémon. Everything you do is saved automatically.

## Using it

1. **Dashboard → + New Problem.** Enter the title, difficulty, tags, language,
   an optional link, and paste your solution. A problem with a solution counts
   as solved. Leave the solution empty to keep it on your list as a to-do.
2. **Claim your reward.** Open a solved problem and click the coin to claim
   Shards (Easy 150 / Medium 300 / Hard 600) and give your team EXP.
3. **Spend it.** Pull Pokémon in **Gacha**, level them in the **Shop**, pick
   your six in **Team**, and send them to the **Meadow** to earn Coins.
   **Quests** and **Recall** quizzes pay out daily.

Tags work like LeetCode topics. Common ones (Arrays, Hash Table, Two Pointers,
Sliding Window, Stack, Binary Search, Trees, Graphs, BFS, DFS, Dynamic
Programming, Greedy…) are built in. Add your own with **+ Tag** in the sidebar
or while editing a problem. Click your trainer name to rename yourself.

## Where your data lives

When the app runs through `npm start`, `npm run dev`, or `npm run preview`, it
saves to a `data/` folder in the project:

```
data/
  progress.json            Pokémon, currencies, team, quests…
  library.json             your problems, solutions, and custom tags
  solutions/
    arrays/two-sum.py      a copy of each solved problem's code,
    hash-table/two-sum.py  in the folder of every tag it has
    …
  backups/2026-09-28/      a daily copy of the two JSON files (last 7 days)
```

- **Saving is automatic.** Problems save within a fraction of a second and
  game progress every couple of seconds. Both also save the moment you switch
  away from or close the tab.
- **Your data is on disk, not in the browser.** It's the same in any browser
  and survives closing the browser or restarting `npm start`.
- **If the server isn't running** (for example you stopped `npm start` with the
  tab still open), a red banner appears and your changes are kept. They save
  automatically once the server is back, even if you closed the tab meanwhile
  and reopen it in the same browser. The dot next to the PokéLeet logo turns red
  whenever something isn't saved.
- **Switching between tabs or browsers is safe.** A tab you come back to loads
  whatever was saved elsewhere first, and the Meadow only runs in the tab you're
  looking at. If two windows are edited side by side at the same moment, the
  older one stops saving and asks you to reload rather than overwrite anything.
- `data/` is git-ignored, so everyone who clones the repo gets their own
  progress. Delete the folder to start over.
- `solutions/` is generated from `library.json`. Edit solutions in the app;
  changes made directly to those files get overwritten.

To keep your data somewhere else, such as a separate git repo for your
solutions, set `POKELEET_DATA_DIR`, e.g. in a `.env.local` file:

```
POKELEET_DATA_DIR=../my-leetcode-solutions
```

**Backups:** Dashboard → **Data** → **Export Backup** downloads everything as
one JSON file. **Import Backup** restores it, including on another computer.

**Upgrading from an older PokéLeet?** Progress saved in the browser by earlier
versions is imported automatically on first launch.

## The online demo

`npm run build:demo` builds a version that needs no server. It saves to the
visitor's browser (localStorage), starts them with a few example problems and
some Coins, and shows a "demo only" notice linking back to
this repo. `.github/workflows/deploy-demo.yml` publishes it to GitHub Pages on
every push to `main`.

To host your own copy (e.g. on a fork): **Settings → Pages → Build and
deployment → Source: GitHub Actions**, then push to `main` or run the workflow
from the **Actions** tab. The regular `npm run build` expects the local server,
so use the demo build for any static hosting.

## Scripts

| Command                | What it does                                       |
| ---------------------- | -------------------------------------------------- |
| `npm start`            | Dev server + opens the app in your browser         |
| `npm run dev`          | Dev server                                         |
| `npm run build`        | Production build into `dist/`                      |
| `npm run preview`      | Serves the production build (with disk saving)     |
| `npm run build:demo`   | Builds the browser-only online demo                |
| `npm run preview:demo` | Serves the demo build locally                      |
| `npm run lint`         | ESLint                                             |

## Project layout

```
server/            Vite plugin + storage API that reads/writes data/
shared/catalog.js  default tags, languages, solution-file layout (browser + server)
src/persistence.js saves the app state to disk (localStorage in the demo)
src/legacy/js/     the game: store, dashboard, gacha, team, meadow… (React)
src/theme.css      the pastel pixel theme
```
