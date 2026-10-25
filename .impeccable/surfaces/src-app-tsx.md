---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/components/layout/AppSider.tsx","src/pages/creator/CreatorDiscoveryPage.tsx"]
---

# Surface brief: Brand app (INFLUENCERMATCH workspace)

Scope: every authenticated Brand screen rendered inside MainLayout (dashboard, campaigns, creator discovery/detail, shortlists, CRM, collaboration, campaign management, performance, history, subscription, brand profile). Auth and Admin inherit this world later.

Visitor mode: Operate. Audience: brand marketers in Vietnam choosing creators for a campaign and running it to ROI. Job: decide which creators fit and prove why. Constraints: keep name, logo.png and the cyan/red offset wordmark; Vietnamese copy; Ant Design stays as the component engine, restyled.

Memorable moment: the match-score plate on every creator.

## Direction contract

THESIS: Every creator hangs a sign: the match score is set as large as the phone number on a Saigon shopfront sign, with the reasons painted underneath. Refuses the category default of a white SaaS dashboard with an indigo gradient pill and a small coloured score badge.

OWN-WORLD: Enamel-blue shell rail (#1D3F8F), warm sign-white ground (#FAF7F0), ink (#141414) 2px rules and outlines, chrome-yellow (#F2C200) score plates, sign-red (#C8102E) reason strips and primary actions. Be Vietnam Pro for text, a heavy condensed numeral face for every figure, tabular. Square-ish 6–8px corners, flat, no gradients, no glow.

STORY: The marketer sees at a glance which creators fit this campaign and why, trusts the reasons over follower counts, and moves the best ones to the shortlist and outreach.

FIRST VIEWPORT: Left blue rail with the current section as a yellow plate; top bar with page title and the active campaign as an ink tag; filter chips; creator rows with metrics in condensed numerals and a score plate (yellow numeral + red three-line reasons) at the right edge; budget capacity bar below.

FORM: Saigon hand-painted shop signage / enamel sign plates, candidate 3 of 7 on the ordered list. Raises: tabular single numeric voice (from data-field challenger); one sign colour per workflow section (from tab-board challenger); budgets and quotas as fixed-capacity fills that never overflow (from j-card challenger). seed:dc43661680e7deea

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Section colour assignment per workflow area (decide in Phase 2 tokens).
- Numeral face: Barlow Condensed (Vietnamese support) unless a better condensed face is found; self-host the fonts.
