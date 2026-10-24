# LifeAdapt mock health tools for Kiro

This is a working, read-only local MCP server with fictional WHOOP and Apple Health examples. It does not authenticate, access devices, read health records, change the website, or send data to either provider. Kiro receives the fictional tool results when you invoke them. No API keys are needed.

## Connect it in Kiro

1. Unzip the full source and open that folder in Kiro.
2. In Kiro's terminal run `node mcp/configure-kiro.cjs` (Node.js 20+ is needed). This configures absolute paths for your computer while preserving other servers. The shipped configuration starts disabled until this setup runs.
3. Reload MCP servers in Kiro, then ask: **Use LifeAdapt's list_mock_profiles tool. Then get_mock_health_readings for provider apple-health and persona A. Explain which fields are simulated.**
4. Allow the tool call when Kiro asks. No tools are automatically approved.
5. Repeat with provider `whoop` and persona `A`, `B`, or `C`.

Tests: `node check-health-mocks.cjs` exercises real stdio protocol messages, fixtures, invalid arguments, and the website's sleep-only import. The server has been tested locally; a successful run inside your Kiro installation still needs to be verified. Keep a screenshot of a real Kiro tool call if you need evidence of Kiro use. This configuration does not prove earlier work used Kiro.

## Data meaning

WHOOP fixtures include recovery percentage, sleep minutes, HRV RMSSD in milliseconds, and daily strain. Steps are not invented as a WHOOP API field. Apple Health fixtures include sleep minutes, step count, and HRV SDNN in milliseconds; they have no WHOOP recovery or strain fields. The fixtures are simplified examples, not complete API responses. The website and MCP share the same fixture values. Its source explorer only applies sleep to the demo planner; all other planner readings stay separate demo inputs.

A real WHOOP connection requires user authorization, API permissions and a tested integration. Real Apple Health access requires an Apple-platform app using HealthKit and user permission, not a generic browser API. HRV SDNN and RMSSD should not be treated as interchangeable.

References: https://kiro.dev/docs/mcp/configuration/ · https://developer.whoop.com/api/ · https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data
