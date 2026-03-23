# RocketRide Inspector Design

## Summary

RocketRide Inspector is a standalone VS Code extension that opens a DevTools-style panel for inspecting RocketRide pipeline runs. The first version focuses on a realistic mock integration path so the debugging experience is complete even without a live RocketRide runtime.

## Goals

- Improve debugging for RocketRide pipelines
- Show per-node inputs, outputs, errors, and metrics
- Make failures and downstream skips easy to understand
- Keep the integration boundary simple so a real RocketRide adapter can replace the mock later

## Architecture

The extension host owns pipeline execution state. A `PipelineExecutionLogger` records node-level events, computes derived metadata, and exposes a serializable snapshot. The extension opens a webview panel, injects the built React app, and passes the execution snapshot through `postMessage`.

The webview is a React application bundled with Vite. It uses Tailwind and shadcn-style UI primitives for the inspector layout and Zustand for local state. The app renders a top timeline and a right-side details panel. Selecting a node updates the inspector contents.

## Data Flow

1. User runs `RocketRide Inspector: Open Demo`
2. Extension creates or reveals the inspector panel
3. Extension simulates a 3-node pipeline execution
4. Logger stores node executions and run summary data
5. Extension sends `{ type: "execution:update", payload }` to the webview
6. Webview updates local store and renders timeline plus details
7. Webview can request `replay-demo` for another simulated run

## UI

- Header: run title, total nodes, failures, latency, tokens, cost
- Timeline: horizontally connected nodes with state, order, time, and metrics
- Details panel: formatted input/output JSON, error trace, metrics, schema validation results
- Failure states: failed nodes highlighted, skipped nodes dimmed

## Error Handling

- Failed nodes carry an error trace string and failed status
- Skipped downstream nodes are represented as executions with null output and skipped schema warnings
- Webview falls back to an empty state if no run has been posted yet

## Testing Strategy

- Build verification for extension and webview
- Deterministic mock run data for demo behavior
- Type-safe interfaces shared across layers

## Scope Control

This version includes the bonus-ready architecture but only implements a replay action from the extension/webview loop. Compare-runs, live streaming, and persistent storage remain future additions.
