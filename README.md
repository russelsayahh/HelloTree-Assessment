# How to run Part A:
cd part-a
npm install
npx vitest run

# How to run part B;
cd part-b/api;
npm install;
cp .env.example .env(for mac); copy .env.example .env (for windows);
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