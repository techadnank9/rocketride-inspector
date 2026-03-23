# RocketRide Inspector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a ready-to-run VS Code extension that opens a React-based inspector panel for a mocked RocketRide pipeline run.

**Architecture:** The extension host manages an in-memory logger and webview lifecycle, while a Vite-bundled React app renders the inspector UI from posted execution snapshots. Shared TypeScript types keep backend and frontend in sync, and deterministic mock data makes the demo reproducible.

**Tech Stack:** TypeScript, VS Code Extension API, React, Vite, Tailwind CSS, Zustand

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.extension.json`
- Create: `README.md`
- Create: `src/extension.ts`
- Create: `src/logger.ts`
- Create: `src/types.ts`
- Create: `webview/index.html`
- Create: `webview/vite.config.ts`
- Create: `webview/postcss.config.js`
- Create: `webview/tailwind.config.ts`
- Create: `webview/src/main.tsx`
- Create: `webview/src/App.tsx`

**Step 1: Write the failing build setup**

Create the initial manifests and TypeScript configs with scripts that expect source files to compile.

**Step 2: Run build to verify it fails**

Run: `npm run build`
Expected: fail because source and config files are incomplete

**Step 3: Write minimal implementation**

Add the missing extension and webview scaffolding so the project builds.

**Step 4: Run build to verify it passes**

Run: `npm run build`
Expected: extension bundle and webview bundle succeed

**Step 5: Commit**

```bash
git add .
git commit -m "feat: scaffold rocketride inspector"
```

### Task 2: Execution Logger And Mock Demo

**Files:**
- Modify: `src/types.ts`
- Modify: `src/logger.ts`
- Modify: `src/extension.ts`

**Step 1: Write the failing test surrogate**

Define the demo behaviors that the logger must support: success, failed, and skipped nodes plus derived totals.

**Step 2: Run targeted verification to show failure**

Run: `npm run build:extension`
Expected: fail until the types and logger APIs line up

**Step 3: Write minimal implementation**

Implement shared execution types, logger snapshot helpers, and extension commands that post demo data to the webview.

**Step 4: Run verification**

Run: `npm run build:extension`
Expected: pass

**Step 5: Commit**

```bash
git add src
git commit -m "feat: add execution logger and demo panel"
```

### Task 3: Inspector UI

**Files:**
- Create: `webview/src/lib/utils.ts`
- Create: `webview/src/store.ts`
- Create: `webview/src/components/Timeline.tsx`
- Create: `webview/src/components/NodeCard.tsx`
- Create: `webview/src/components/DetailsPanel.tsx`
- Create: `webview/src/components/ui/button.tsx`
- Create: `webview/src/components/ui/card.tsx`
- Create: `webview/src/components/ui/badge.tsx`
- Create: `webview/src/components/ui/separator.tsx`
- Modify: `webview/src/App.tsx`

**Step 1: Write the failing UI contract**

Reference the shared run payload and selected-node interactions before the components exist.

**Step 2: Run webview build to verify failure**

Run: `npm run build:webview`
Expected: fail until UI modules are implemented

**Step 3: Write minimal implementation**

Add the Zustand store, timeline, details panel, status styling, and replay interaction.

**Step 4: Run verification**

Run: `npm run build:webview`
Expected: pass

**Step 5: Commit**

```bash
git add webview
git commit -m "feat: build inspector webview"
```

### Task 4: Documentation And Final Verification

**Files:**
- Modify: `README.md`

**Step 1: Write the failing doc requirement**

Ensure the README covers problem, solution, features, screenshots placeholders, how to run, and demo steps.

**Step 2: Run full verification**

Run: `npm run build`
Expected: all targets pass

**Step 3: Write minimal implementation**

Finish the README and tighten any remaining build issues.

**Step 4: Run verification to confirm green**

Run: `npm run build`
Expected: pass with no errors

**Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add rocketride inspector guide"
```
