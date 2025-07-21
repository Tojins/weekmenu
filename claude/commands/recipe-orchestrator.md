# Recipe Pipeline Orchestrator

This command orchestrates the 4-phase recipe pipeline by launching agents to execute each phase when there's work to be done.

## Pipeline Overview

1. **Phase 1**: Generate search queries when too little exist in INITIAL status
2. **Phase 2**: Process search queries in INITIAL status to find URL candidates
3. **Phase 3**: Process URL candidates in INITIAL status by scraping recipes and matching ingredients
4. **Phase 4**: Process URL candidates in ACCEPTED status by creating recipes and recipe_ingredients

## Execution

The orchestrator will:
1. Record the start time when beginning orchestration
2. Check all phases for available work using the queries above
3. **CRITICAL: Launch agents concurrently for ALL phases that have work in a SINGLE message with multiple Task tool calls** - do not launch agents sequentially
4. When any agent completes, if less than 2.5 minutes have elapsed, check **ALL** inactive phases again and launch agents for all phases that have work (again, all in parallel in one message)
5. Wait for all running agents to complete before exiting

## Implementation

### Timeout Tracking
- Record start time when orchestration begins
- Stop launching new agents after 2.5 minutes (150 seconds)
- Always allow running agents to complete

### Check Phase 1 Work
Phase 1 needs to run when there are too little search queries with status 'INITIAL'. Check using:
```bash
node scripts/db-utils.js count-initial-search-queries
```
If the count is less than 2, Phase 1 needs to generate more search queries.

### Check Phase 2 Work
Phase 2 needs to run when there ARE search queries with status 'INITIAL'. Check using:
```bash
node scripts/db-utils.js find-initial-search-query
```
If this returns a search query (not empty), Phase 2 has work to do.

### Check Phase 3 Work
Phase 3 needs to run when there are URL candidates with status 'INITIAL'. Check using:
```bash
node scripts/db-utils.js find-initial-url-candidate
```
If this returns a URL candidate (not empty), Phase 3 has work to do.

### Check Phase 4 Work
Phase 4 needs to run when there are URL candidates with status 'ACCEPTED'. Check using:
```bash
node scripts/db-utils.js find-accepted-url-candidate
```
If this returns a URL candidate (not empty), Phase 4 has work to do.

### Execute Phases

**IMPORTANT**: When multiple phases have work, launch ALL agents simultaneously in a single message with multiple Task tool calls.
Launch agents for each phase that has work:

1. **Phase 1 Agent**:
   - Task: "Generate recipe search queries"
   - Prompt: "Execute instructions in claude/commands/recipe-phase1.md to generate search queries for recipes"

2. **Phase 2 Agent**:
   - Task: "Process search queries to find URLs"
   - Prompt: "Execute instructions in claude/commands/recipe-phase2.md to process INITIAL search queries and find recipe URL candidates"

3. **Phase 3 Agent**:
   - Task: "Evaluate recipes from URLs"
   - Prompt: "Execute instructions in claude/commands/recipe-phase3.md to evaluate recipes from INITIAL URL candidates"

4. **Phase 4 Agent**:
   - Task: "Insert recipes and ingredients"
   - Prompt: "Execute instructions in claude/commands/recipe-phase4.md to insert recipes and recipe_ingredients for ACCEPTED recipes"
