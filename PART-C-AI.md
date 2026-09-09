I used claude code as my development tool during both parts, and ChatGPT to understand the assesment, plan the work and review claude's proposal.

Part A:
Prompt 1: " Port this code from PHP to TypeScript without fixing any bugs. "

Prompt 2: " Find the bug that causes installment due dates that land on strange dates. explain whats wrong, where is it and how i should fix it. dont change the code "

Prompt 3: " test the installmentservice and check if there are any cases where it gives the wrong result then explain what each test is checking.


Part B:
# Prompt 1 — Planning:
I need to build Part B of the assessment. Read the requirements and make me a simple plan for the backend, frontend, database, tests, and seed data. Keep the scope realistic for the 2.5 hour time limit.


# Prompt 2 — Plan the architecture

Based on the requirements, propose a simple architecture for the backend, frontend, database, and tests. Explain the important decisions briefly and avoid adding features that aren't required.

# Prompt 3 — Review the plan

Review your plan against the assessment requirements. Point out anything missing, risky, or over-engineered before we start coding.

# Prompt 4 — Implement the backend

Implement the backend based on the approved plan. Focus on the business rules and keep the code easy to understand and maintain. Don't add unnecessary features.

# Prompt 5 — Implement the frontend

Build the frontend based on the requirements, but keep the UI simple and clean. I'll review the layout and make the final UI decisions myself.

# Prompt 6 — Add realistic test data

Add seed data with a few clients and around 12 requests. Make sure the data covers the different statuses and priorities, including urgent new requests older than 24 hours so I can test the flag.

# Prompt 7 — Test the business rules

Test the important business rules through the API, especially status transitions, resolution notes, authorization, and the 24-hour urgent request rule. Fix any issues you find and run the tests again.

# Prompt 8 — Verify with PostgreSQL

Run the application against a real PostgreSQL database from scratch. Run the schema, seed the data, and run the complete test suite. Fix any problems you find.

# Prompt 9 — Final review

Do a final review of Part B against the assessment requirements. Check the backend, frontend, database, authorization, tests, and build. Don't add anything that isn't necessary for the assessment.


# One thing the AI got wrong and i caught and how:
during the database verification, the seed.js file that claude generated had a syntax error when i tried to run it. I looked at the error in the code and it was caused by an escaping problem. I told claude where the error was and what it was. It was fixed and I ran it again to make sure that it worked.

# One thing I would never let an AI tool do unsupervised on a live client system, and why. 
I would never let the AI make any changes to the database unsupervised because the AI can make changes that can accidently delete or modify important data.

# One thing the AI produced that I accepted without changing, and why I trusted  it. 
