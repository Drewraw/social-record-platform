# Social Record Platform — End-to-End Contributor Guide

> The **Social Record Platform** is an **open civic media forum** — not a media company, but a collaborative infrastructure for **open governance**.
> It allows citizens, developers, journalists, and institutions to collectively **record, measure, and discuss** public promises, governance actions, and performance outcomes.
>
> Unlike traditional media outlets that publish content, this platform **stores, structures, and tracks** information around specific issues and officials.
> Every campaign or discussion is backed by verifiable data, enabling transparency and accountability at scale.

---

## 🌍 How It Differs From Media Platforms

| Media Company             | Social Record Platform (open governance civic forum)                                 |
| ------------------------- | ------------------------------------------------------- |
| Publishes news or stories | Records, links, and analyzes governance data            |
| Operates privately        | Functions as an open-source civic utility               |
| Focuses on narratives     | Focuses on measurable outcomes                          |
| Driven by editorial teams | Driven by open community, developers, and verified data |
| Creates content           | Enables citizens to **govern through data**             |

---

## 🧩 Platform’s Core Principle

> “The Social Record Platform is **a forum, not a publisher** — a bridge between citizens and government performance, powered by data and open participation.”

---

## 🏗️ Functional Summary

1. **Issue-Centric Forum:**

   * Each campaign focuses on a **specific issue** (e.g., road safety, clean water project, digital policy).
   * Users, moderators, and automated agents can open discussions and campaigns around these issues.
2. **Governance Data Infrastructure:**

   * Stores measurable data from official and verified sources (e.g., ECI, MyNeta, Twitter/X, media reports).
   * Uses data to show progress, trends, and accountability over time.
3. **Civic Measurement Engine:**

   * Quantifies how government promises and public works evolve.
   * Generates performance scorecards to make governance measurable and public.

---

## 💡 Core Message

> The platform is **a civic technology forum** that powers open governance by connecting issues, officials, and verified data — enabling citizens to not just discuss, but also **measure change**.

---

## ⚙️ Summary of Platform Roadmap

The **Social Record Platform** is being developed in two major phases — **Phase 1** and **Phase 2** — both of which may progress **in parallel**. Phase 1 focuses on building the foundation (profiles and data aggregation), while Phase 2 builds on top of that foundation to enable civic discussions forums, and measure accountability towards

### Current Development Phases
Phase One (Prototype)
Branch: [phaseone]--https://github.com/Drewraw/social-record-platform/tree/phase-one Preview: https://claude.ai/public/artifacts/d012c4c8-5c74-4965-aeee-b2245f304bf6
Description: First MVP showcasing the core app layout and logic.

Phase Two (Debug Build)
Branch: [feature/phase2-debug]--https://github.com/Drewraw/social-record-platform/tree/feature/phase-2-debug 
Description: Second MVP with debugging, performance tweaks, and new modules.
preview : https://claude.ai/public/artifacts/c7871b72-2a71-4fa7-b2f6-1d83925ab4a3

### 🧩 **Phase 1 — “Profiles Foundation” (branch: `phase-one`)

> Build the data backbone — a dynamic and verified repository of every elected official in India.

#### 🎯 Objective

Create a **Profiles Dashboard** that aggregates and stores **professional and personal details** of elected officials, forming the foundation for campaign tracking in the next phase.

#### 🏗️ Core Features

**Data Aggregation Engine:**
Fetch and consolidate data from trusted sources like:

* [MyNeta.info](https://www.myneta.info/) — affidavits, assets, criminal records
* [ECI India](https://eci.gov.in/) — election results and candidate details
* **Twitter/X API** — verified public posts and engagement trends
* **Google News / Search APIs** — related articles, media appearances
* **Performance APIs or Custom Metrics** — promises vs. outcomes, budgets, etc.

**Profile Dashboard UI:**

* For each MLA/MP: show photo, bio, constituency, party, term history, and data source links.
* Each profile acts as a **central node** connecting to future campaigns, promises, and discussions.

**Database Storage:**

* Store data in PostgreSQL (core profile info)
* Store images, documents, and media links in S3
* Ensure records are uniquely identified by `official_id` (e.g., ECI code or MyNeta ID)

**Admin Tools:**

* Allow admins to trigger data aggregation jobs
* Manage duplicates and data validation

#### 🧱 Deliverable

A working **Profiles Dashboard** + database of officials ready for campaign linking.

#### 🌿 Branch

```bash
git checkout phase-one
```

---
### 🚀 **Phase 2 — “Campaign & Interaction Layer” (branch: `feature/phase2-debug`)

> Build on top of the Phase 1 data foundation — enabling users, moderators, and the platform itself to create **issue-based campaigns** linked to officials and departments.

#### 🎯 Objective

Enable **public forum creation, discussion, and tracking** using verified official profiles as anchors.

#### ⚙️ Core Features

**Campaign Creation System:**

* Users, moderators, or auto-generated bots can create campaigns related to a specific issue or promise.
* Each campaign links directly to one or more officials or departments (from Phase 1 data).

**Moderation Flow:**

* Moderators (journalists, YouTubers, verified users) approve or verify campaigns before they go live.

**Admin Dashboard Expansion:**

* Manage forumns, tags (issues, policies), and performance metrics.

**Community Discussion Threads:**

* Each forumn has a dedicated discussion space (like GitHub Discussions threads) for updates and feedback.

**Insights Engine:**

* Track engagement, fact-checks, and fulfillment progress over time.

**Automation (Future):**

* Auto-generate campaigns from verified data sources (e.g., news or government reports).

#### 🧱 Deliverable

A fully interactive **Civic Campaign Platform** — where discussions, metrics, and accountability data converge.

#### 🌿 Branch

```bash
git checkout feature/phase2-debug
```

---

### 🔗 **Phase Dependency**

* **Phase 2 depends entirely on Phase 1’s data pipeline and profile dashboard.**
* The campaign and discussion modules use the official profiles as their base dataset — making Phase 1 a must-complete foundation.
* However, both phases may **proceed side by side**, with contributors working on backend improvements (Phase 2) while the core data foundation (Phase 1) evolves.

---

### ✅ Note for Contributors

> You are encouraged to contribute to either **Phase 1 (data foundation)** or **Phase 2 (campaign system)** depending on your skillset — backend, frontend, or data aggregation. Both are open for collaboration.

Thank you for contributing to this civic innovation platform and helping make governance more transparent and accountable!
