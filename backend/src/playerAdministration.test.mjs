import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url), mount=require('../build/handlers/admin.js').default;
const {deletedAccessToken,deletedProxyToken}=require('../build/playerAdministration.js');
const clone=structuredClone;
const values=(obj,path)=>{const parts=path.split('.');const walk=(o,i)=>i===parts.length?[o]:Array.isArray(o)?o.flatMap(v=>walk(v,i)):walk(o?.[parts[i]],i+1);return walk(obj,0);};
const matches=(doc,query)=>Object.entries(query).every(([k,v])=>{
 if(k==='$or')return v.some(q=>matches(doc,q));
 const actual=values(doc,k);
 if(v&&typeof v==='object'&&!(v instanceof Date)){
  if('$exists'in v)return actual.some(x=>x!==undefined)===v.$exists;
  if('$gt'in v)return actual.some(x=>x>v.$gt);
  if('$in'in v)return actual.some(x=>v.$in.includes(x));
  if('$regex'in v)return actual.some(x=>typeof x==='string'&&new RegExp(v.$regex,v.$options||'').test(x));
 }
 return actual.some(x=>v===null?x==null:x===v);
});
const set=(obj,path,value)=>{const keys=path.split('.'),last=keys.pop();for(const k of keys)obj=obj[k]??={};obj[last]=clone(value);};
function harness(){
 const docs={users:[],admin:[],posts:[],votes:[],translations:[],orders:[],sessions:[]};
 let writes=0,failAt=0,ended=0;
 const mutate=()=>{writes++;if(failAt&&writes===failAt)throw Error('injected storage failure');};
 const collection=name=>({
  async findOne(q){return clone(docs[name].find(d=>matches(d,q))||null);},
  find(q){const rows=()=>clone(docs[name].filter(d=>matches(d,q)));return{project(){return this;},limit(n){this.n=n;return this;},async toArray(){return rows().slice(0,this.n);},async *[Symbol.asyncIterator](){yield* rows();}};},
  async insertOne(d){mutate();docs[name].push(clone(d));return{insertedId:d._id};},
  async updateOne(q,u,opts={}){let d=docs[name].find(d=>matches(d,q));if(!d&&!opts.upsert)return{matchedCount:0,modifiedCount:0};mutate();if(!d){d={...q};docs[name].push(d);for(const[k,v]of Object.entries(u.$setOnInsert||{}))set(d,k,v);}for(const[k,v]of Object.entries(u.$set||{}))set(d,k,v);return{matchedCount:1,modifiedCount:1};},
  async findOneAndUpdate(q,u){const before=await this.findOne(q);if(!before)return null;await this.updateOne(q,u);return before;},
  async deleteMany(q){mutate();const before=docs[name].length;docs[name]=docs[name].filter(d=>!matches(d,q));return{deletedCount:before-docs[name].length};},
  async deleteOne(q){mutate();const i=docs[name].findIndex(d=>matches(d,q));if(i<0)return{deletedCount:0};docs[name].splice(i,1);return{deletedCount:1};},
  async updateMany(q,u){mutate();for(const d of docs[name].filter(d=>matches(d,q)))for(const[k,v]of Object.entries(u.$pull||{}))set(d,k,values(d,k)[0].filter(row=>!matches(row,v)));},
  async replaceOne(q,replacement){mutate();const i=docs[name].findIndex(d=>matches(d,q));if(i>=0)docs[name][i]=clone(replacement);},
 });
 const locals={userCollection:collection('users'),adminCollection:collection('admin'),feedbackCollection:collection('posts'),feedbackVotesCollection:collection('votes'),feedbackTranslationsCollection:collection('translations'),orderCollection:collection('orders'),sessionCollection:collection('sessions')};
 locals.databaseClient={startSession(){return{async withTransaction(fn){const before=clone(docs);try{await fn();}catch(e){Object.assign(docs,before);throw e;}},async endSession(){ended++;}};}};
 const routes={},middlewares=[];mount({use:fn=>middlewares.push(fn),post:(p,fn)=>routes[p]=fn,get(){}});
 const call=async(path,body,session={currentUser:{uid:'owner',username:'19Trojan69'}},network='testnet')=>{
  const req={body,session,headers:{'x-cryptoid-app-network':network},get:()=>network,app:{locals}};
  const res={code:200,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
  for(const mw of middlewares){let ok=false;await mw(req,res,()=>{ok=true;});if(!ok)return res;}
  await routes[path](req,res);return res;
 };
 const player={_id:'id-pilot',uid:'pilot-a',username:'A.+(pilot)',accessToken:'private-token',email:'private-email',playerByNetwork:{testnet:{version:5,activeRunId:null,balance:42,mission:{saved:'keep'}}},careerScoreByNetwork:{testnet:500},bestRunByNetwork:{testnet:{score:300,level:2}},bestScoreV2:{testnet:300}};
 docs.users.push(clone(player),{_id:'id-other',uid:'other',username:'Other',careerScoreByNetwork:{testnet:999}},{_id:'owner-id',uid:'owner',username:'19Trojan69'});
 const prepare=action=>call('/players/prepare',{uid:player.uid,username:player.username,action,network:'testnet'});
 const execute=(review,extra={})=>call('/players/execute',{network:'testnet',token:review.token,confirm:true,confirmUsername:player.username,playerRequestedDeletion:true,...extra});
 return{docs,locals,call,player,prepare,execute,get writes(){return writes;},get ended(){return ended;},fail(n){writes=0;failAt=n;}};
}
function setup(t){const prior=[process.env.ADMIN_PI_TESTNET_UID,process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION];process.env.ADMIN_PI_TESTNET_UID='owner';process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION='enabled';t.after(()=>{for(const[i,key]of ['ADMIN_PI_TESTNET_UID','CRYPTOID_TESTNET_ACCOUNT_DELETION'].entries())if(prior[i]===undefined)delete process.env[key];else process.env[key]=prior[i];});return harness();}
test('every player operation rechecks the server owner, exact literal names and request network',async t=>{
 const h=setup(t),before=clone(h.docs);
 for(const path of ['/players/find','/players/prepare','/players/execute']){
  assert.equal((await h.call(path,{},{})).code,401);
  assert.equal((await h.call(path,{}, {currentUser:{uid:'other',username:'19Trojan69'},adminUid:'owner',adminMode:true})).code,403);
 }
 assert.deepEqual(h.docs,before);
 const found=await h.call('/players/find',{username:'@a.+(PILOT)',network:'testnet'});
 assert.equal(found.body.players.length,1);assert.equal(found.body.players[0].uid,h.player.uid);
 assert.ok(!JSON.stringify(found.body).includes('private-'));
 assert.equal((await h.call('/players/find',{username:'.*',network:'testnet'})).body.players.length,0);
 assert.equal((await h.call('/players/find',{username:'Other',network:'mainnet'})).code,400);
 h.docs.users.push({...clone(h.player),uid:'duplicate'});
 assert.equal((await h.call('/players/find',{username:h.player.username,network:'testnet'})).body.players.length,2);
});
test('score deletion changes only selected network records and consumes an owner-bound review once',async t=>{
 const h=setup(t);h.docs.users[0].careerScoreByNetwork.mainnet=800;const before=clone(h.docs.users[0]);
 const p=await h.prepare('scores');assert.equal(p.code,200);assert.match(p.body.token,/^[a-f0-9]{48}$/);
 assert.ok(!JSON.stringify(h.docs.admin).includes(p.body.token),'only a token hash is stored');
 assert.equal((await h.execute(p.body,{confirmUsername:'Other'})).code,409);
 assert.equal((await h.execute(p.body,{network:'mainnet'})).code,400);
 assert.equal((await h.execute(p.body)).code,200);
 const after=h.docs.users[0];assert.equal(after.careerScoreByNetwork.testnet,0);assert.equal(after.careerScoreByNetwork.mainnet,800);
 assert.deepEqual(after.playerByNetwork,before.playerByNetwork);assert.equal(after.accessToken,before.accessToken);
 assert.equal(h.docs.users[1].careerScoreByNetwork.testnet,999);assert.equal((await h.execute(p.body)).code,409);
});
test('review expiry, changed save, active run and account-owner protections cannot delete data',async t=>{
 const h=setup(t);let p=await h.prepare('scores');h.docs.admin[0].expiresAt=new Date(0);assert.equal((await h.execute(p.body)).code,409);
 p=await h.prepare('scores');h.docs.users[0].playerByNetwork.testnet.version++;assert.equal((await h.execute(p.body)).code,409);
 h.docs.users[0].playerByNetwork.testnet.activeRunId='playing';assert.equal((await h.prepare('scores')).code,409);
 assert.equal((await h.call('/players/prepare',{network:'testnet',uid:'owner',username:'19Trojan69',action:'account'})).code,403);
 assert.equal(h.docs.users.length,3);
});
function community(h){
 h.docs.posts.push({_id:'mine',uid:'pilot-a',description:'private-post'},{_id:'other-post',uid:'other',replies:[{uid:'pilot-a',text:'private-reply'},{uid:'other',text:'keep'}]});
 h.docs.votes.push({uid:'pilot-a',postId:'other-post'},{uid:'other',postId:'mine'},{uid:'other',postId:'other-post'});
 h.docs.translations.push({postId:'mine',text:'private-translation'},{postId:'other-post',text:'private-reply-translation'},{text:'legacy-private-copy'},{postId:'unrelated',text:'keep'});
 h.docs.sessions.push({session:JSON.stringify({currentUser:{uid:'pilot-a',username:'A.+(pilot)'}})},{session:{currentUser:{uid:'pilot-a'}}},{session:JSON.stringify({currentUser:{uid:'other'}})});
 h.docs.orders.push({_id:'paid',user:'pilot-a',paid:true,pi_payment_id:'payment-id',product_id:'weapon_twin',quantity:1,accessToken:'private-token',wallet:'private-wallet',payment_network:'Pi Testnet'},{_id:'unpaid',user:'pilot-a',paid:false},{_id:'other-order',user:'other',paid:true});
}
test('account deletion atomically removes personal data and sessions, unlinks paid references and revokes previous tokens',async t=>{
 const h=setup(t);community(h);const p=await h.prepare('account');
 assert.equal((await h.execute(p.body,{playerRequestedDeletion:false})).code,400);
 assert.equal((await h.execute(p.body)).code,200);assert.equal(h.ended,1);
 assert.equal(h.docs.users.some(u=>u.uid==='pilot-a'),false);
 assert.deepEqual(h.docs.posts,[{_id:'other-post',uid:'other',replies:[{uid:'other',text:'keep'}]}]);
 assert.deepEqual(h.docs.votes,[{uid:'other',postId:'other-post'}]);assert.deepEqual(h.docs.translations,[{postId:'unrelated',text:'keep'}]);
 assert.equal(h.docs.sessions.length,1);assert.equal(h.docs.orders.length,2);
 const paid=h.docs.orders.find(o=>o._id==='paid');assert.equal(paid.pi_payment_id,'payment-id');assert.equal(paid.playerUnlinked,true);assert.equal(paid.user,undefined);assert.equal(paid.accessToken,undefined);
 assert.ok(!JSON.stringify(h.docs).includes('private-'));assert.ok(!JSON.stringify(h.docs).includes('pilot-a'));
 assert.equal(await deletedAccessToken(h.locals.adminCollection,'pilot-a','private-token'),true);
 assert.equal(await deletedAccessToken(h.locals.adminCollection,'pilot-a',''),true);
 assert.equal(await deletedAccessToken(h.locals.adminCollection,'pilot-a','fresh-login-token'),false);
 assert.equal(await deletedProxyToken(h.locals.adminCollection,'private-token'),true);
 assert.equal(await deletedProxyToken(h.locals.adminCollection,'fresh-login-token'),false);
 assert.equal((await h.execute(p.body)).code,409);
});
test('account deletion rolls back all changes when any transactional write fails',async t=>{
 const measured=setup(t);community(measured);let p=await measured.prepare('account');measured.fail(0);assert.equal((await measured.execute(p.body)).code,200);const count=measured.writes;assert.ok(count>=10);
 for(let n=1;n<=count;n++){
  const h=harness();community(h);p=await h.prepare('account');const before=clone(h.docs);h.fail(n);
  assert.equal((await h.execute(p.body)).code,503,`write ${n}`);assert.deepEqual(h.docs,before,`rollback at write ${n}`);assert.equal(h.ended,1);
 }
});
test('cross-network data and missing transaction/configuration block account deletion before changes',async t=>{
 const h=setup(t);h.docs.users[0].playerByNetwork.mainnet={balance:3};const before=clone(h.docs.users);
 assert.equal((await h.prepare('account')).code,409);assert.deepEqual(h.docs.users,before);
 delete h.docs.users[0].playerByNetwork.mainnet;
 delete process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION;
 assert.equal((await h.prepare('account')).code,503);
 process.env.CRYPTOID_TESTNET_ACCOUNT_DELETION='enabled';const p=await h.prepare('account');delete h.locals.databaseClient;
 const data=clone(h.docs);assert.equal((await h.execute(p.body)).code,503);assert.deepEqual(h.docs,data);
});
