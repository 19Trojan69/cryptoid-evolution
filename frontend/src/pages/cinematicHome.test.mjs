import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import {translate,languages} from '../i18n.ts';
import * as model from './homeNetworkModel.ts';

// Execute the actual TSX without a browser. Host integrations remain stubs;
// these checks do not claim Pi authentication or a real mobile browser test.
function component(file,imports,globals={}) {
  const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const exports={};vm.runInNewContext(code,{exports,require:name=>{
    if(name==='react/jsx-runtime')return jsx;
    if(name==='react'&&!imports.react)return {useRef:value=>({current:value}),useEffect:()=>{},useState:value=>[typeof value==='function'?value():value,()=>{}]};
    if(name==='./gameFullscreen'&&!imports[name])return {isGameFullscreen:()=>false};
    if(name.endsWith('.css'))return {};
    assert.ok(name in imports,`Unmapped dependency: ${name}`);return imports[name];
  },...globals});return exports.default;
}
const elements=tree=>{
  const result=[];const walk=node=>{if(!node||typeof node!=='object')return;if(node.type)result.push(node);const children=node.props?.children;for(const child of Array.isArray(children)?children.flat(Infinity):[children])walk(child);};walk(tree);return result;
};
const text=node=>typeof node==='string'?node:typeof node==='number'?String(node):Array.isArray(node)?node.map(text).join(''):node?.props?text(node.props.children):'';

test('every home button invokes its actual supplied action and the actual rank is shown',()=>{
  const hits=[],callbacks=Object.fromEntries(['Play','Career','Cards','Community','Terms','Sound'].map(name=>['on'+name,()=>hits.push(name)]));
  const Home=component('./CinematicHome.tsx',{'../i18n':{useLocale:()=>({t:source=>translate('de',source)})},'../components/ServiceBadge':{default:()=>null},'../components/BlockchainIcon':{default:()=>null},'./HomeEarthNetwork':{default:()=>null}});
  const nodes=elements(Home({...callbacks,paused:false,busy:false,signedIn:true,rankName:'Admiral',musicEnabled:true,musicLabel:'Ton ausschalten'}));
  const buttons=nodes.filter(node=>node.type==='button');assert.equal(buttons.length,6);
  assert.ok(!nodes.some(node=>node.props.className==='cinematic-profile'));
  for(const button of buttons){assert.equal(button.props.type,'button');button.props.onClick();}
  assert.deepEqual(hits.sort(),['Play','Career','Cards','Community','Terms','Sound'].sort());
  assert.ok(nodes.some(node=>node.props.name==='Admiral'));
  assert.ok(nodes.some(node=>node.props.className==='cinematic-career-copy'&&text(node).includes('Admiral')));
  const busy=elements(Home({...callbacks,busy:true,musicEnabled:false,musicLabel:'Ton einschalten'}));
  assert.equal(busy.find(node=>node.props.className==='cinematic-play').props.disabled,true);
  assert.equal(busy.find(node=>node.props.className==='cinematic-cards').props.disabled,true);
  assert.equal(busy.find(node=>node.props.className?.includes('cinematic-sound')).props['aria-pressed'],false);
});

test('new visible labels are translated in all 19 selectable languages',()=>{
  for(const locale of Object.keys(languages))for(const key of ['Your career','Service rank & progress','View progress','Community','Exit full screen','Edit profile image & bio','This browser does not support full screen. Use the installed app for a view without the address bar.','The browser did not allow full screen. You can continue playing in this view.','The installed app is already displayed without the browser address bar.']) {
    const translated=translate(locale,key);assert.ok(translated.length>0);
    if(!['en','de'].includes(locale))assert.notEqual(translated,key,`${locale}: ${key}`);
  }
});

function autoFullscreenHome({hidden=false,active=false}={}) {
  let now=0,sequence=0,cursor=0,requests=0;
  const hooks=[],pending=[],timers=new Map(),events=new Map();
  const doc={hidden,fullscreenElement:active?{}:null,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
  const Home=component('./CinematicHome.tsx',{
    react:{useRef:initial=>{const i=cursor++;return hooks[i]??(hooks[i]={current:initial});},useEffect:(fn,deps)=>{const i=cursor++,old=hooks[i];if(!old||deps.some((dep,n)=>dep!==old.deps[n]))pending.push(()=>{old?.cleanup?.();hooks[i]={deps,cleanup:fn()};});}},
    '../i18n':{useLocale:()=>({t:source=>translate('de',source)})},'../components/ServiceBadge':{default:()=>null},'../components/BlockchainIcon':{default:()=>null},'./HomeEarthNetwork':{default:()=>null},
    './gameFullscreen':{isGameFullscreen:()=>Boolean(doc.fullscreenElement),requestGameFullscreen:()=>{requests++;return Promise.resolve('denied');}},
  },{document:doc,setTimeout:(fn,delay)=>{timers.set(++sequence,{fn,due:now+delay});return sequence;},clearTimeout:id=>timers.delete(id)});
  const render=(paused=false)=>{cursor=0;const nodes=elements(Home({paused,busy:false,signedIn:false,musicEnabled:false}));pending.splice(0).forEach(fn=>fn());return nodes;};
  const tick=duration=>{now+=duration;for(const [id,timer] of [...timers])if(timer.due<=now){timers.delete(id);timer.fn();}};
  return {doc,render,tick,emit:name=>events.get(name)?.(),requests:()=>requests,timers:()=>timers.size,listeners:()=>events.size,unmount:()=>hooks.forEach(hook=>hook.cleanup?.())};
}

test('home has no fullscreen control and makes only one quiet attempt after three seconds',async()=>{
  const h=autoFullscreenHome(),nodes=h.render();
  assert.ok(!nodes.some(node=>node.props.className?.includes('cinematic-fullscreen')));
  h.tick(2999);assert.equal(h.requests(),0);h.tick(1);assert.equal(h.requests(),1);
  await new Promise(setImmediate);h.render();h.tick(10000);h.emit('visibilitychange');h.tick(3000);
  assert.equal(h.requests(),1);assert.equal(h.timers(),0);
  h.unmount();assert.equal(h.listeners(),0);
});

test('hidden home waits until visible and dialogs cancel its timer',()=>{
  const h=autoFullscreenHome({hidden:true});h.render();h.tick(10000);assert.equal(h.requests(),0);
  h.doc.hidden=false;h.emit('visibilitychange');h.tick(2000);h.render(true);h.tick(5000);assert.equal(h.requests(),0);
  h.render(false);h.tick(2999);assert.equal(h.requests(),0);h.tick(1);assert.equal(h.requests(),1);h.unmount();
});

test('navigation away cancels delayed entry and releases all home listeners',()=>{
  const h=autoFullscreenHome();h.render();h.tick(1000);h.unmount();h.tick(5000);
  assert.equal(h.requests(),0);assert.equal(h.timers(),0);assert.equal(h.listeners(),0);
});

test('home never exits existing fullscreen or re-enters after the user leaves it',()=>{
  for(const initiallyActive of [true,false]) {
    const h=autoFullscreenHome({active:initiallyActive});h.render();
    if(!initiallyActive){h.doc.fullscreenElement={};h.emit('fullscreenchange');}
    h.doc.fullscreenElement=null;h.emit('fullscreenchange');h.render(true);h.render(false);h.emit('visibilitychange');h.tick(10000);
    assert.equal(h.requests(),0);h.unmount();assert.equal(h.listeners(),0);
  }
});

test('the signed-in account button opens the existing profile action',()=>{
  let opened=0;
  const Header=component('../components/Header.tsx',{'../i18n':{useLocale:()=>({t:source=>translate('de',source)})},'react-router-dom':{Link:()=>null},'./BlockchainIcon':{default:()=>null},'./WolfLogo':{default:()=>null},'./ServiceBadge':{default:()=>null}});
  const tree=Header({user:{username:'19Trojan69',roles:[]},onOpenQuickAccess:()=>{},onOpenProfile:()=>opened++,onSignIn:()=>{}});
  const account=elements(tree).find(node=>node.type==='button'&&node.props.className==='header-account');
  assert.ok(account);account.props.onClick();assert.equal(opened,1);assert.match(account.props['aria-label'],/@19Trojan69/);
  const copy=elements(account).find(node=>node.props.className==='header-account-copy');
  const children=copy.props.children;
  assert.equal(children[0].type,'b');assert.equal(text(children[0]),'@19Trojan69');
  assert.equal(children[1].props.className,'header-profile-label');assert.match(text(children[1]),/Pilotenprofil/);
});

test('home actions reach the existing game, career, cards, feedback and profile in Shop',()=>{
  const source=readFileSync(new URL('./Shop.tsx',import.meta.url),'utf8');
  const ast=ts.createSourceFile('Shop.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const imports={};
  for(const statement of ast.statements)if(ts.isImportDeclaration(statement)&&statement.importClause) {
    const entry={default:()=>null},binding=statement.importClause.namedBindings;
    if(binding&&ts.isNamedImports(binding))for(const item of binding.elements)entry[item.name.text]=()=>null;
    imports[statement.moduleSpecifier.text]=entry;
  }
  let cursor=0,user=null,authRequests=0,fullscreen=0;
  const memory=[],navigations=[],storage=new Map();
  imports.react={useState:initial=>{const id=cursor++;if(!(id in memory))memory[id]=typeof initial==='function'?initial():initial;return[memory[id],next=>memory[id]=typeof next==='function'?next(memory[id]):next];},useRef:initial=>{const id=cursor++;return memory[id]??(memory[id]={current:initial});},useCallback:fn=>fn,useEffect:()=>{}};
  imports['react-router-dom']={useLocation:()=>({state:null}),useNavigate:()=>target=>navigations.push(target)};
  imports['../i18n']={useLocale:()=>({locale:'de',t:source=>translate('de',source)})};
  imports['../hooks/useAuth']={useAuth:()=>({user,authReady:true,isLoading:false,adminMode:false,requireAuth:()=>authRequests++})};
  imports['../hooks/usePayments']={usePayments:()=>({isLoading:false})};
  const skin={id:'ship-01',sprite:1,name:'Scout'},color={id:'silver',name:'Silver'};
  Object.assign(imports['./shipFleet'],{playerSkins:[skin],playerColors:[color],allPlayerColors:[color],selectedShip:()=>({skin,color}),readShipFleet:()=>({}),fleetCount:()=>1,shardBalance:()=>150});
  Object.assign(imports['./rewardProgress'],{emptyRewardProgress:()=>({highestLevel:1,linkedBlocks:{},completedChains:[],bossWins:{},bonusMedals:{}}),rankForLevel:()=>({name:'Rookie'}),CHAIN_MILESTONES:[]});
  imports['../../../backend/src/hangarCatalog']={hangarCatalog:[]};
  imports['./musicPreferences']={readMusicVolume:()=>50,readEffectsVolume:()=>50,MUSIC_STORAGE_KEY:'music'};
  imports['./gameFullscreen']={requestGameFullscreen:()=>fullscreen++,toggleGameFullscreen:()=>fullscreen++};
  const componentTypes=['./CinematicHome','./FeedbackHub','./PilotProfile','./Collection','../components/Header','../components/TermsDialog','./CareerDashboard','../components/QuickAccessMenu'];
  for(const name of componentTypes)imports[name]={default:Object.assign(()=>null,{displayName:name})};
  const storageApi={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const Shop=component('./Shop.tsx',imports,{window:{location:{hostname:'testnet.local'}},localStorage:storageApi,sessionStorage:storageApi,document:{activeElement:null},HTMLElement:class{}});
  const render=()=>{cursor=0;return elements(Shop());};
  const find=(nodes,name)=>nodes.find(node=>node.type===imports[name].default);
  let nodes=render(),home=find(nodes,'./CinematicHome');home.props.onPlay();assert.deepEqual(navigations,['/game']);assert.equal(fullscreen,1);
  home.props.onCareer();nodes=render();assert.ok(find(nodes,'./CareerDashboard'));
  const close=nodes.find(node=>node.type==='button'&&node.props.className==='close-button');assert.ok(close);close.props.onClick();
  nodes=render();home=find(nodes,'./CinematicHome');assert.equal(home.props.paused,false);home.props.onCards();nodes=render();assert.ok(find(nodes,'./Collection'));assert.equal(find(nodes,'./CinematicHome').props.paused,true);
  find(nodes,'./Collection').props.onClose();nodes=render();home=find(nodes,'./CinematicHome');home.props.onCommunity();nodes=render();assert.ok(find(nodes,'./FeedbackHub'));assert.equal(find(nodes,'./CinematicHome').props.paused,true);
  find(nodes,'./FeedbackHub').props.onClose();nodes=render();find(nodes,'../components/Header').props.onOpenProfile();assert.equal(authRequests,1);
  user={uid:'qa-only',username:'qa',roles:[]};nodes=render();find(nodes,'../components/Header').props.onOpenProfile();nodes=render();assert.ok(find(nodes,'./PilotProfile'));assert.equal(find(nodes,'./CinematicHome').props.paused,true);
  find(nodes,'./PilotProfile').props.onClose();nodes=render();find(nodes,'./CinematicHome').props.onTerms();nodes=render();assert.ok(find(nodes,'../components/TermsDialog'));
  find(nodes,'./CinematicHome').props.onSound();assert.equal(storage.get('music'),'off');
  assert.equal(storage.size,1); // No player, payment, reward or inventory writes.
});

test('animation stops for hidden pages, dialogs and reduced motion, and releases all listeners',()=>{
  const callbacks=new Map(),documentEvents=new Map(),mediaEvents=new Map(),windowEvents=new Map();let sequence=0,effect,painted=0,refs=[];
  const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})}, {get:(target,key)=>target[key]??(()=>{if(key==='clearRect')painted++;})});
  const canvas={clientWidth:431,width:0,height:0,getContext:()=>ctx};
  const document={hidden:false,documentElement:{dataset:{motion:'standard'}},addEventListener:(name,fn)=>documentEvents.set(name,fn),removeEventListener:name=>documentEvents.delete(name)};
  const media={matches:false,addEventListener:(name,fn)=>mediaEvents.set(name,fn),removeEventListener:name=>mediaEvents.delete(name)};
  let mutation;
  const Network=component('./HomeEarthNetwork.tsx',{'react':{memo:fn=>fn,useId:()=>':home:',useRef:value=>{const ref={current:refs.length===0?canvas:value};refs.push(ref);return ref;},useEffect:fn=>effect=fn},'./homeNetworkModel':model},
    {window:{devicePixelRatio:3,matchMedia:()=>media,addEventListener:(name,fn)=>windowEvents.set(name,fn),removeEventListener:name=>windowEvents.delete(name)},document,MutationObserver:class{constructor(fn){mutation=fn;}observe(){}disconnect(){}},Path2D:class{},requestAnimationFrame:fn=>{callbacks.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>callbacks.delete(id)});
  Network({paused:false});const cleanup=effect();assert.equal(callbacks.size,1);assert.ok(canvas.width<=1024);
  for(let frame=0;frame<240;frame++){const [id,fn]=[...callbacks][0];callbacks.delete(id);fn(frame*1000/24);}
  assert.ok(painted>100);const clock=refs[1].current.time;assert.ok(clock>8);
  document.hidden=true;documentEvents.get('visibilitychange')();assert.equal(callbacks.size,0);
  document.hidden=false;documentEvents.get('visibilitychange')();assert.equal(callbacks.size,1);
  media.matches=true;mediaEvents.get('change')();assert.equal(callbacks.size,0);
  media.matches=false;mediaEvents.get('change')();assert.equal(callbacks.size,1);
  document.documentElement.dataset.motion='reduced';mutation();assert.equal(callbacks.size,0);
  cleanup();assert.equal(callbacks.size,0);assert.equal(documentEvents.size,0);assert.equal(mediaEvents.size,0);assert.equal(windowEvents.size,0);
  refs=[];document.documentElement.dataset.motion='standard';Network({paused:true});const pausedCleanup=effect();assert.equal(callbacks.size,0);pausedCleanup();
});
