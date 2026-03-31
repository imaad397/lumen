# Lumen

> AI-powered startup due diligence — in seconds, not days.

Lumen is an open-source investment research platform that 
fires five parallel web searches, analyzes pitch decks 
(including scanned and image-based PDFs), cross-checks 
founder claims against live web data, and delivers a 
structured analyst-grade brief in under 60 seconds.

Built in one night for a hackathon by a first-year CS student
using Cursor, Convex, Exa, and Groq.

**Live demo →** https://your-vercel-url.vercel.app

---

## The problem

Researching a startup before a meeting means opening 30 tabs,
manually hunting through news archives, LinkedIn profiles, 
Reddit threads, and court records — and still ending up with 
an incomplete picture. For angel investors evaluating hundreds 
of deals a year this is simply not sustainable.

Lumen collapses that entire process into a single input.

---

## Demo

| Input | What Lumen does |
|---|---|
| Startup name | Searches the entire web across 5 categories simultaneously |
| Website or LinkedIn URL | Anchors search to that specific company even if it has no press coverage |
| Pitch deck PDF | OCRs every slide, extracts all claims, cross-checks against live web data |

---

## Features

- **Three input modes** — search by name, paste any URL 
  (website, LinkedIn, Twitter/X), or upload a pitch deck PDF
- **Five parallel Exa searches** firing simultaneously
  - Funding and news
  - Founder background and credibility
  - Competitive landscape
  - Red flags, complaints, and legal issues
  - Tech stack and hiring signals
- **Pitch deck analysis** — reads every claim founders make 
  and cross-checks each one against live web sources
- **Image-based PDF support** — scanned decks and PowerPoint 
  exports are rendered page by page in the browser via 
  pdfjs-dist and read by Groq vision OCR — no text layer needed
- **Five color-coded research tiles** — each category has its 
  own visual identity so you navigate instantly to what matters
- **Final analyst verdict** — synthesized only after all 
  sections complete, every claim cited to a numbered source, 
  includes a signal rating and top 3 things to verify
- **Live streaming report** — sections populate in real time 
  as each search resolves, no waiting for everything to finish
- **Share via link** — every report gets a unique URL, 
  loads instantly with no login required
- **Download as PDF** — clean white A4 export with 
  color-coded tiles, source domains, dates, and the full 
  analyst verdict formatted to match the web version

---

## Tech stack

| Tool | Role |
|---|---|
| [Exa](https://exa.ai) | Neural semantic web search — finds content by meaning not keywords |
| [Convex](https://convex.dev) | Real-time backend, database, file storage, and scheduled server actions |
| [Groq](https://groq.com) | Fast LLM inference — Llama 3.3 70B for analysis, Llama 4 Scout for vision OCR |
| [Cursor](https://cursor.com) | AI-assisted development — entire app built using Agent mode |
| React + Vite + TypeScript | Frontend framework |
| Tailwind CSS | Styling |
| Framer Motion | Animations and transitions |
| pdfjs-dist | Browser-side PDF page rendering for image-based decks |
| jsPDF | Client-side PDF report export |
| Vercel | Hosting and deployment |

---

The key architectural decision is that Convex handles 
everything between the browser and the APIs. The browser 
never calls Exa or Groq directly — all API keys stay 
server-side inside Convex actions. The frontend subscribes 
to the report document reactively and every patch 
automatically triggers a re-render.

---

## Why each tool was chosen

**Exa over Google Search API** — Exa uses neural/semantic 
search which finds content by meaning rather than keywords. 
A keyword search for "founder background" returns SEO 
articles. Exa's semantic search finds the obscure 2019 blog 
post about the founder's failed previous startup that has 
never been indexed by normal search. The `useAutoprompt` 
feature also rewrites each query automatically to maximise 
semantic relevance before searching.

**Convex over a traditional backend** — Convex's reactive 
`useQuery` hook is what makes the live streaming feel 
possible. Every time the server patches one section of the 
report, the frontend re-renders that section automatically 
with zero websocket management or polling code. Convex file 
storage handles pitch deck images up to 1GB, completely 
bypassing the 1MB mutation argument limit that broke the 
original base64 approach.

**Groq over OpenAI** — Groq runs Llama 3.3 70B at inference 
speeds that make the final verdict appear in 2 to 3 seconds 
rather than 15 to 20 seconds. Groq also provides the Llama 4 
Scout vision model used for pitch deck OCR, meaning the 
entire LLM layer runs on one provider with one API key.

**Cursor over a normal editor** — the entire codebase was 
written using Cursor Agent mode which creates files, runs 
terminal commands, reads errors, and fixes them 
autonomously. Zero prior knowledge of Convex or Exa was 
needed before starting.

---

## Use cases

**Angel investors** — run a sanity check before a first call.
Surface red flags, failed prior ventures, or direct 
competitors in 60 seconds before writing a check.

**VC analysts** — first-pass screening before writing an 
investment memo. Generate a Lumen report in 60 seconds and 
use the remaining time to go deeper on what matters.

**Accelerators and incubators** — triage large application 
batches without building an internal research team.

**Founders** — benchmark your own startup, understand how 
the market perceives you, and anticipate investor questions 
before walking into a pitch meeting.

**Corporate development teams** — competitive intelligence 
and acquisition target screening without engaging expensive 
research firms.

---

## How to get the most out of Lumen

Use the pitch deck upload alongside the name search — the 
PDF analysis tells you what founders claim and the web 
research tells you what is actually verifiable. The 
cross-check section of the final verdict highlights the gap.

For small or early-stage startups with little press 
coverage, use URL mode instead of name search. Paste the 
company website or LinkedIn page so Exa can anchor its 
results even when the name alone returns nothing useful.

Treat red flags as leads, not conclusions. A single 
Glassdoor complaint is very different from a pattern of 
regulatory actions. Lumen surfaces the signal — the 
interpretation is yours.

Share the report URL with co-investors before alignment 
calls. The link loads the full live report with no login 
required.

---

## Important notes

Lumen is a research acceleration tool, not a 
decision-making oracle. The analyst brief is a synthesis 
of publicly available information — it is not financial 
advice and is not a substitute for direct conversations, 
legal review, or reference checks. Use it as the first 
10 percent of your research process, not the last.

Pitch deck cross-check flags discrepancies between 
founder claims and what is publicly verifiable — treat 
flagged items as leads to investigate further, not as 
confirmed problems.

---

## License

MIT — see [LICENSE](./LICENSE) for full text.

---

## Author

Built by Imaad Siddiqui (https://github.com/imaad397)  

---

## Acknowledgements

- [Exa](https://exa.ai) for building a search API that 
  actually understands meaning
- [Convex](https://convex.dev) for making real-time 
  backends approachable without a backend team
- [Groq](https://groq.com) for inference speeds that make 
  the product feel instant
- [Cursor](https://cursor.com) for making this possible 
  to build in a single night

---

*If you found this useful, star the repo ⭐*

*Built with Cursor · Powered by Exa, Convex, and Groq*
