# ScoutAI -- Agentic Sports Intelligence Platform

## Overview

AI-powered sports analytics platform that gathers data from multiple
REST APIs, validates data, and generates insights, charts, and reports.

## Tech Stack

-   **Frontend:** React, TypeScript, Tailwind CSS, TanStack Query,
    Chart.js
-   **Backend:** Node.js, Express, Prisma, PostgreSQL
-   **AI:** OpenAI API, LangChain/LangGraph (optional)
-   **APIs:** football-data.org, API-Football, NBA API, News API
    (optional)

## Agent Workflow

``` text
User
  ↓
Request Orchestrator
  ├─ Intent Agent
  ├─ Data Retrieval Agent
  ├─ Data Validation Agent
  ├─ Insight Agent (LLM)
  ├─ News Agent
  ├─ Visualization Agent
  └─ Report Agent
  ↓
Frontend Dashboard
```

## Agents

### Intent Agent

Determines user intent (team comparison, match preview, player
analysis).

### Data Retrieval Agent

Fetches: - Fixtures - Standings - Team & player stats - Head-to-head -
Injuries - News

### Data Validation Agent

-   Removes duplicates
-   Checks stale/missing data
-   Re-fetches if needed

### Insight Agent

Uses structured API data to generate AI summaries and match analysis.

### News Agent

Aggregates and summarizes transfers, injuries, and sports news.

### Visualization Agent

Generates: - Radar charts - Form graphs - Goal timelines - Team
comparisons

### Report Agent

Exports match previews and analytics as downloadable reports.

## Example Flow

1.  User asks: "Compare Arsenal vs Chelsea."
2.  Intent Agent identifies comparison request.
3.  Retrieve stats, injuries, H2H, standings.
4.  Validate collected data.
5.  AI generates insights.
6.  Charts and report are displayed.

## Optional Features

-   AI Sports Chat
-   Team Scout
-   Match Preview
-   Transfer Tracker
-   Player Comparison
-   Favorite Team Notifications

## Resume Highlights

-   Multi-API REST integration
-   AI-assisted workflows
-   Backend architecture
-   Data validation
-   Dashboard & visualization
-   Authentication
-   Scheduled jobs
-   Full-stack deployment
