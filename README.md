# LifeAdapt

LifeAdapt helps people adjust a sample day around their recovery, sleep and an important event tomorrow. It offers full-length and lighter plans, explains proposed changes, and lets the user decide what to apply.

**Live demo:** https://lifeadapt.netlify.app/

**90-second captioned walkthrough:** https://lifeadapt.netlify.app/demo.html

Independent hackathon concept, not an official WHOOP or Apple product.

## Try the demo

1. Choose Maya (Active regular), then click **Connect your WHOOP**. This loads fictional readings, not a real account.
2. Add an unexpected meeting from 19:30 to 20:30.
3. Open **Protect Tomorrow**, keep Maya's morning group run and click **Build my plan**.
4. Compare the full and lighter options. Review the explanation for moving recovery notes away from the meeting.
5. Click **Use this plan** to apply your chosen option. Undo is available.

Flexible routines can be moved or swapped, while external commitments stay locked. Timing suggestions are advisory. Optional breaks can be moved or dismissed. The Demo Clock drives upcoming/in-progress/completed status; completed means the event's end time has passed.

## Health examples and limitations

The published website uses simulated recovery/sleep/HRV/strain readings and a sample calendar. The mock source explorer shows WHOOP-style recovery, sleep, HRV RMSSD and strain, or Apple Health-style sleep, steps and HRV SDNN. Applying a mock source changes sleep only; other planner inputs remain separate examples. Steps do not drive scheduling. HRV methods are not interchangeable.

The planner and wellness suggestions use illustrative rules, not a trained medical model. Planned time in bed is not measured sleep. This is not an ongoing real calendar synchronization.

Real WHOOP server code is included but is not enabled in the current static deployment and has not been tested with a real account. Credentials, registered callback URL and a function deployment are still needed. Real Apple Health access is not implemented; production access would require an Apple app using HealthKit and permission.

Demo preferences and sample plans are saved in browser local storage. Real imported readings, if the server integration is enabled, remain in page memory. Voice capture depends on browser support and permission; speech processing may be performed by the browser's service. LifeAdapt does not save audio. Voice capture itself has not been verified.

## Run locally

Node.js 20+ is needed. No npm dependencies are required for the included tests or mock MCP server.

```sh
node preview-whoop.cjs
```

Open http://localhost:8765/. Without WHOOP environment variables, explore the simulated demo.

## Tests

There are 17 check*.cjs suites in the project root. Run each with Node, for example:

```sh
node check-health-mocks.cjs
node check-plan-options-calendar.cjs
node check-whoop.cjs
```

The full suite checks personas, clock status, date handling, manual moves/swaps, timing suggestions, breaks, plan choices, approval/undo, export content, simulated connections, real WHOOP code with artificial responses, scheduling text parsing and the MCP protocol. External calendar import and real account syncing have not been verified.

## Kiro and mock MCP

See [mcp/README.md](mcp/README.md). Run `node mcp/configure-kiro.cjs` in your own source checkout, then reload MCP servers in Kiro. The initial configuration is disabled until configured for that computer. No automatic tool approvals or credentials are included.

The mock MCP protocol has been tested locally. Terminal-driven MCP verification in Kiro passed on October 24, 2026 with matching source hashes. This does not constitute a native MCP-client connection or a full website test run in Kiro. See KIRO-USAGE.md for evidence and limitations.

## Hosting

For the static demo, upload dist/index.html as index.html to Netlify. Real WHOOP functions require deploying this full project with netlify.toml and setting secrets on the server. Never commit .env or tokens.

## Latest interaction improvements
Demo syncing now shows a visible confirmation with sample readings and a sync time. Adding an unexpected meeting leaves existing activities untouched and suggests one optional short reset in a free gap if available. A conflict notice names any overlapping future activities and offers a direct route to review a draft. Approval is still explicit; the warning clears after a valid plan is approved.

## Team
Guilherme Ozores, Pratham Doshi and Xianglin Zheng.

Public video: https://youtu.be/7rfpP4aMYmk
