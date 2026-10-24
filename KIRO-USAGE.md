# LifeAdapt: Kiro evidence

Team: LifeAdapt — Guilherme Ozores, Pratham Doshi, Xianglin Zheng.

## Existing build session inspected

https://app.kiro.dev/session/8e830cee-b0d6-434a-ad3f-4b4eb3dfa927

The signed-in Kiro transcript contains the original WHOOP Adapt implementation, deterministic scheduler, calendar/state code, shortening/rejection/scenario-isolation bug fixes and Node regression-test runs. Its final report records 28 scheduler tests and 6 state tests passing. It explicitly marks browser testing as not completed. This is evidence of work on the original prototype, not proof that Kiro built every later LifeAdapt addition.

## Current verification

Verified on October 24, 2026 in this Kiro session:
https://app.kiro.dev/session/d7866231-a254-470e-906e-cf929a0a0773

Kiro wrote the provided files, computed matching SHA-256 hashes and ran `node check-mcp-protocol.cjs` with exit code 0. I expanded the actual command record and observed:

PASS: MCP stdio initialize, tools/list, six provider/persona calls, invalid arguments and profile listing.

Kiro independently retrieved Apple Health persona A (475 minutes sleep, 8,200 steps, HRV SDNN 65 ms) and WHOOP persona C (38% recovery, HRV RMSSD 32 ms, 340 minutes sleep, strain 15). These are fictional values, not real API responses.

Source hashes matched:
- mcp/health-mock-server.cjs: 8b99aa6673aa8ba6544f13b1221fb2e2b9e8b722a0367a723737e5d897304984
- mcp/mock-health-data.json: 700ed32702e4e9482a0112d34c7ade0faa8c39c1438d722a221cbaa24cc26705
- check-mcp-protocol.cjs: ab3a0e5eef2716b8ea1450cd4e014ec2bd4d538bc26751a1e32c600d194d04a3

The saved transcript and screenshot document this run. This task tests MCP messages through Kiro terminal tools; it is distinct from registering and invoking a native MCP connection within Kiro. The full latest website test suite has not been run in Kiro.
