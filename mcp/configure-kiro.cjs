'use strict';
const fs=require('node:fs'),path=require('node:path');
const target=path.resolve(__dirname,'../.kiro/settings/mcp.json');
const config=fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):{};
config.mcpServers={...config.mcpServers,'lifeadapt-health-mocks':{command:process.execPath,args:[path.join(__dirname,'health-mock-server.cjs')],disabled:false,autoApprove:[]}};
fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(config,null,2)+'\n');
console.log('Configured LifeAdapt mock health MCP for this computer. Reload MCP servers in Kiro.');
