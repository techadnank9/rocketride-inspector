# RocketRide Inspector

Chrome DevTools for RocketRide pipelines.

## Problem

RocketRide pipelines are powerful, but debugging pipeline runs inside the IDE is still too opaque. Developers need a faster way to inspect node inputs, outputs, failures, latency, token usage, and cost while iterating on `.pipe` workflows.

## Solution

RocketRide Inspector is a VS Code extension that opens a DevTools-style webview panel for pipeline execution observability. It visualizes execution order, highlights failures, surfaces schema mismatches, and shows per-node metrics in a focused debugging experience.

## Features

- Pipeline execution timeline with node order, timestamps, and status
- Click-to-inspect node inputs, outputs, schema validation, and errors
- Performance metrics including latency, token usage, and cost estimate
- Failure visualization for failed and downstream skipped nodes
- Demo replay command for repeatable UI walkthroughs

## Screenshots

- `[Placeholder] Inspector overview timeline`
- `[Placeholder] Node details with failed schema validation`
- `[Placeholder] Replay demo action`

## Project Structure

```text
rocketride-inspector/
  demo/
    simple-chat.pipe
  src/
    extension.ts
    logger.ts
    types.ts
  webview/
    src/
      App.tsx
      components/
        Timeline.tsx
        NodeCard.tsx
        DetailsPanel.tsx
    index.html
  package.json
  tsconfig.json
  README.md
```

## How To Run

1. Install dependencies:

```bash
npm install
```

2. Build the extension and webview:

```bash
npm run build
```

3. Open the project in VS Code.

4. Press `F5` to launch the Extension Development Host.

5. In the new VS Code window, open the Command Palette and run:

```text
RocketRide Inspector: Open Demo
```

## Demo Steps

1. Launch the demo command to open the inspector panel.
2. Review the timeline for the three mocked nodes.
3. Click `Generate Reply` to inspect a realistic simple-chat response.
4. Click `Score Response` to inspect the failure trace and schema mismatch.
5. Click `Publish Message` to inspect the downstream skipped state.
6. Use `Replay Demo Run` to simulate another pipeline run.

## Demo Scenario

The bundled demo includes:

- `Generate Reply`: successful simple-chat response node
- `Score Response`: failed post-processing node with schema error
- `Publish Message`: skipped downstream node

Matching demo pipeline file:

- [demo/simple-chat.pipe](/Users/adnan/Documents/rocketride-inspector/demo/simple-chat.pipe)

## Notes

- The current release uses a mock RocketRide adapter to keep the extension fully runnable.
- The execution logger is designed so a real RocketRide runtime hook can replace the demo feed later.
