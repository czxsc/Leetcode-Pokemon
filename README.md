# PokéLeet

A cozy, gamified LeetCode tracker. Log the problems you solve, paste in your
solutions, and earn Shards to pull Pokémon, build a team, and send it out to
battle in the Meadow.

## Quick start

You need [Node.js](https://nodejs.org) 20.19+ or 22.13+.

```bash
git clone <this repo>
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

- Saving is automatic, both while you play and whenever you close the tab.
  The dot next to the PokéLeet logo turns red if a save fails.
- `data/` is git-ignored, so everyone who clones the repo gets their own
  progress. Delete the folder to start over.
- `solutions/` is generated from `library.json`. Edit solutions in the app;
  changes made directly to those files get overwritten.
- Only open the app in one tab at a time. If another tab saves newer data, the
  older tab stops saving and asks you to reload, so it can't overwrite your
  progress.

To keep your data somewhere else, such as a separate git repo for your
solutions, set `POKELEET_DATA_DIR`, e.g. in a `.env.local` file:

```
POKELEET_DATA_DIR=../my-leetcode-solutions
```

**Backups:** Dashboard → **Data** → **Export Backup** downloads everything as
one JSON file. **Import Backup** restores it, including on another computer.

**Without the local server** (e.g. if you deploy `npm run build` to static
hosting), the app still works but saves to the browser's localStorage, and
solution files aren't written.

**Upgrading from an older PokéLeet?** Progress saved in the browser by earlier
versions is imported automatically on first launch.

## Scripts

| Command           | What it does                                      |
| ----------------- | ------------------------------------------------- |
| `npm start`       | Dev server + opens the app in your browser        |
| `npm run dev`     | Dev server                                        |
| `npm run build`   | Production build into `dist/`                     |
| `npm run preview` | Serves the production build (with disk saving)    |
| `npm run lint`    | ESLint                                            |

## Project layout

```
server/            Vite plugin + storage API that reads/writes data/
shared/catalog.js  default tags, languages, solution-file layout (browser + server)
src/persistence.js saves the app state to disk (or localStorage as a fallback)
src/legacy/js/     the game: store, dashboard, gacha, team, meadow… (React)
src/theme.css      the pastel pixel theme
```
