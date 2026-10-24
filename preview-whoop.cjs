// Local QA server. No real credentials or fake health readings are supplied here.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {handler}=require('./netlify/functions/whoop');
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost:8765');
 if(url.pathname.startsWith('/.netlify/functions/whoop/')){
  try{const result=await handler({path:url.pathname,httpMethod:req.method,headers:req.headers,queryStringParameters:Object.fromEntries(url.searchParams)});res.writeHead(result.statusCode,{...result.headers,...Object.fromEntries(Object.entries(result.multiValueHeaders||{}))});res.end(result.body);}catch{res.writeHead(500,{'Content-Type':'application/json'});res.end('{"error":"preview"}');}return;
 }
 if(url.pathname!=='/'){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(fs.readFileSync(path.join(__dirname,'dist/index.html')));
});server.listen(8765,'127.0.0.1',()=>console.log('LifeAdapt preview: http://localhost:8765'));
