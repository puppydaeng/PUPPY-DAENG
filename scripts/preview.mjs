import {createServer} from "node:http";
import worker from "../src/worker.js";
const port=Number(process.env.PORT||8787);
const server=createServer(async(req,res)=>{
 try{
  const url="http://localhost:"+port+req.url;
  const request=new Request(url,{method:req.method});
  const response=await worker.fetch(request,{BASE_DOMAIN:"",PUBLIC_INDEXING:"false"});
  res.writeHead(response.status,Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){res.writeHead(500,{"Content-Type":"text/plain"});res.end(String(e.stack||e));}
});
server.listen(port,()=>console.log("노버블펫 미리보기: http://localhost:"+port+"/  견종 미리보기: http://localhost:"+port+"/__preview__/maltipoo/"));
