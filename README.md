# PokéLeet

## Overview

A gamified, Pokémon-themed LeetCode tracker. Log the problems you solve, earn
Shards to pull and collect Pokémon, and deploy your team to battle during Leetcode study sessions
to earn coins for upgrades.

- **Problem library:** log problems with difficulty, tags, link, and your
  solution. Solutions are also saved to a `solutions/` folder, sorted by tag.
- **Shards for solving:** Easy 150, Medium 300, Hard 600. Spend them on the
  Summon tab.
- **Study sessions (Focus tab):** Deploy Team opens LeetCode. The timer runs while
  LeetCode is your active tab and pauses otherwise. Your team battles for
  Coins, Shards, and EXP only while it runs. A session ends after 5 minutes
  paused, after 3 hours, or when you end it.
- **Onboarding:** on first launch, pick a trainer name, an optional photo, and
  a partner Pokémon from every generation's starters (plus Pikachu and Eevee).
  Four random commons and one random rare join it for a starting team of six.
- **Team building:** level up your six, evolve duplicates, and unlock Mega and
  Gigantamax forms with Shop items bought with Coins.
- **Summon items** from the Shop, used on a Single Draw: a Rate Booster (double
  Epic and Legendary odds), a Great Ball (always Rare), an Ultra Ball (always
  Epic), and a Generation Ticket (pick the generation, and combine it with any
  of the others).
- **Daily Quests** that step up as you claim them (solve 1 → 3 → 5 problems,
  Focus 30 min → 2 h), and **Recall quizzes** for bonus Shards.
- **Progression quests:** six chapters of one-time goals, from your first draw
  to solving problems in every tag. Each chapter opens once the one before it
  is fully claimed.

## Dependencies

- [Node.js](https://nodejs.org) 20.19+, 22.13+, or 24+
- [Git](https://git-scm.com)
- A Chromium browser for study sessions: Chrome, Edge, Brave, Opera, Vivaldi,
  or Arc. Firefox and Safari run everything except study sessions.

## Setup

1. Get the code and start it:
   ```bash
   git clone https://github.com/czxsc/Leetcode-Pokemon.git
   cd Leetcode-Pokemon
   npm install
   npm start
   ```
   PokéLeet opens at http://localhost:5173. Keep the terminal open.
2. Install the PokéLeet Tracker extension, which study sessions need:
   1. Go to `[browser]://extensions`, e.g. `chrome://extensions`
      (`edge://extensions`, `brave://extensions`, `opera://extensions`,
      `vivaldi://extensions`).
   2. Turn on **Developer mode**.
   3. Click **Load unpacked** and pick the `extension` folder inside
      `Leetcode-Pokemon`.
3. Reload the PokéLeet tab.
4. Open **Focus**. It should say **Tracker connected**.
5. Click **Deploy Team** to start a session.

Next time, just run `npm start` in the folder.

## Updating

```bash
git pull
npm install
npm start
```

If the Focus tab says **Tracker needs an update**, go to `[browser]://extensions`,
click the reload icon (↻) on **PokéLeet Tracker**, then reload the PokéLeet tab.

## Ways to run it

| | Data lives in | Accounts | Study sessions |
| --- | --- | --- | --- |
| **Local** (`npm start`, above) | `data/` in the project folder | no, just you | yes |
| **Cloud** (your own AWS account) | DynamoDB + PostgreSQL | yes, email or Google | yes, with the [Tracker from its Focus tab](docs/deploying.md#study-sessions-on-the-cloud-app) |
| **Online demo** | this browser only | no | no |

**Demo:** https://czxsc.github.io/Leetcode-Pokemon/

> [!WARNING]
> The demo is for trying PokéLeet out only. Progress is saved in that browser
> only, so clearing site data or switching browsers or devices starts over.
> Study sessions don't work there.

**Personal use:** run it locally as above. Progress is saved to `data/` in the
project folder, which is git-ignored so everyone who clones gets their own.
Delete `data/` to start over, or use **Dashboard → Data → Export Backup** to
move it to another computer.

**Cloud:** deploy it to your own AWS account with sign-up and sync across
devices. See [docs/deploying.md](docs/deploying.md).

## How it's built

- **Web app:** React 19 + Vite. The game rules are pure TypeScript functions
  (`src/game/`), separate from the UI (`src/features/`).
- **API:** a TypeScript [Hono](https://hono.dev) app (`api/`). It runs as a
  Vite plugin locally and as an AWS Lambda in the cloud, with storage behind
  one interface: JSON files locally, **DynamoDB** (game progress) and
  **Aurora PostgreSQL** (problem library, via Drizzle ORM) in the cloud.
  Requests are validated with Zod.
- **Cloud:** CloudFront, S3, API Gateway with a Cognito JWT authorizer,
  Lambda, DynamoDB, and Aurora Serverless v2 (scales to zero), all defined with
  the **AWS CDK** (`infra/`). Sign-in is Cognito's managed login, styled to
  match the app, with optional Google sign-in.
- **CI/CD:** GitHub Actions runs lint, type checks, unit tests and
  integration tests (against DynamoDB Local and PostgreSQL), and a CDK synth. It deploys
  `main` to AWS through GitHub OIDC, with no stored keys.

More in [docs/architecture.md](docs/architecture.md), with the reasoning behind
each choice in [docs/adr](docs/adr/).

## Development

```bash
npm test             # unit and integration tests
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run format       # Prettier
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the project layout and conventions.

## Disclaimer

PokéLeet is a free, non-commercial fan project, not affiliated with or endorsed
by Nintendo, Creatures Inc., GAME FREAK inc., The Pokémon Company or LeetCode.
Pokémon names and images belong to their owners.

## License

[MIT](LICENSE). The license covers this project's code, not the Pokémon names
and images.
