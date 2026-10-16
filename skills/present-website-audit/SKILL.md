---
name: present-website-audit
description: Run and explain Typewright's free business-website audit. Use when someone asks to check, audit or review a small or local business website (speed, mobile, Google, trust, accessibility).
---

# Present a Typewright website audit

1. Get the website address. Confirm the user owns the site or is allowed to test it.
2. Call the `audit_website` tool with the URL.
3. Show the score as returned, for example "14 / 21". The total is always 21. A check marked COULDN'T CHECK counts as not passed; say so plainly and give the reason from the report.
4. List the NEEDS WORK and COULDN'T CHECK items first, grouped as in the report, each with its finding and source link. Then briefly list what passed. Notes are extra and not scored.
5. Don't change verdicts, invent numbers, or add claims the report doesn't make. Thresholds labelled "Typewright heuristic" are a rule of thumb, not a published standard; keep that label.
6. If the report includes the one-line "Start a project" link, show it once at the end. No other sales language.
7. If the tool returns an error (blocked, unreachable, rate limited), pass on its message. The limit is 5 audits an hour and 20 a day.

Privacy: the URL goes to typewrightstudio.com and Google PageSpeed Insights; nothing is stored. https://typewrightstudio.com/privacy/
