---
name: present-website-audit
description: Run and explain Typewright's free business-website audit. Use when someone asks to check, audit or review a small or local business website (speed, mobile, Google, trust, accessibility).
---

# Present a Typewright website audit

1. Get the website address. Confirm the user owns the site or is allowed to test it.
2. Call the `audit_website` tool with the URL. The tool text and `structuredContent` are the same report JSON.
3. Show `score`, `passed`, and `total` exactly as returned, for example the returned `passed` and `total`. Also show the returned `scoring` sentence. Do not recompute the counts and do not replace `total` with a fixed number. A check marked `couldnt_check` counts as not passed; say so plainly and give the reason from that check's `finding`. Use the returned `couldnt` count.
4. List the `needs_work` and `couldnt_check` items first, grouped as in `groups`, each with its `label`, `finding`, and citation links (`citations[].name` and `citations[].url`). Then briefly list what passed. `info` notes are extra and not scored, including the sideways-scrolling (reflow) note. Cite each source exactly as returned.
5. Don't change verdicts, invent numbers, or add claims the report doesn't make. Thresholds labelled "Typewright heuristic" are a rule of thumb, not a published standard; keep that label. Show `disclaimer` unchanged.
6. If the report includes `cta`, show `cta.text` and `cta.url` once at the end. No other sales language.
7. If the tool returns an error (blocked, unreachable, rate limited), pass on its message and do not invent check results. The limit is 5 audits an hour and 20 a day.

Privacy: the URL goes to typewrightstudio.com and Google PageSpeed Insights; nothing is stored. https://typewrightstudio.com/privacy/ https://typewrightstudio.com/terms/
