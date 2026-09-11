# How to run Part A:
cd part-a
npm install
npx vitest run

# How to run part B;
Prerequisite: - Node.js ;
              - PostgreSQL 17 must be installed and running locally.
- For mac:
brew install postgresql@17
brew services start postgresql@17

- For Windows:
winget install PostgreSQL.PostgreSQL

- To run: Open terminal and run: 
cd part-b/api;
npm install;
cp .env.example .env (for mac); copy .env.example .env (for windows);
Edit .env and replace PASSWORD with your local PostgreSQL password.
npm run db:setup;
npm run db:reset;
npm test;
npm run dev;

then, in another terminal :
cd part-b/web;
npm install;
npm run dev;


## Time Report

| Part | Time Spent | Finished? | If Not, What Is Missing |
|------|------------|-----------|-------------------------|
| A | 1h 00m | Yes | — |
| B | 2h 00m | Yes | — |
| C | 0h 30m | Yes | — |
| D | 0h 20m | Yes | — |
| Setup and README | 1h 00m | Yes | — |
| **Total** | **5h 00m** | **Yes** | — |