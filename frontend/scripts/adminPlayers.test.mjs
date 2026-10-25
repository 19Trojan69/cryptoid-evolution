import test from 'node:test';
import assert from 'node:assert/strict';
import {componentHost} from './componentTestHost.mjs';
import {adminText} from '../src/adminLocale.ts';
const player={uid:'pilot-a',username:'ExactName',network:'testnet',careerScore:100,bestRun:{score:75,level:1},activeRun:false,accountDeletionAllowed:true};
function panel(){const calls=[];const h=componentHost('src/pages/AdminPlayers.tsx','AdminPlayers',{}, {
 useAdminLocale:()=>({t:adminText}),shipSaveNetwork:'testnet',axiosClient:{async post(path,body){calls.push({path,body});if(path.endsWith('/find'))return{data:{players:[player]}};if(path.endsWith('/prepare'))return{data:{...player,...body,token:'a'.repeat(48)}};return{data:{deleted:true}};}},
 });const button=label=>h.nodes().find(n=>n.type==='button'&&n.props.children.includes(label));
 const inputs=()=>h.nodes().filter(n=>n.type==='input');
 return{...h,calls,button,inputs,async find(){inputs()[0].props.onChange({target:{value:'ExactName'}});h.render();h.nodes().find(n=>n.type==='form').props.onSubmit({preventDefault(){}});await h.flush();}};
}
test('actual admin UI requires reviewed target, exact name and explicit request before account deletion',async()=>{
 const h=panel();await h.find();h.button('Account vollständig löschen').props.onClick();await h.flush();
 assert.equal(h.calls.at(-1).path,'/admin/players/prepare');assert.equal(h.button('Löschung bestätigen').props.disabled,true);
 h.inputs().find(n=>n.props.type==='checkbox').props.onChange({target:{checked:true}});h.render();assert.equal(h.button('Löschung bestätigen').props.disabled,true);
 const confirmation=h.inputs().find(n=>n.props.value===''&&n.props.type!=='checkbox');confirmation.props.onChange({target:{value:'exactname'}});h.render();assert.equal(h.button('Löschung bestätigen').props.disabled,true);
 h.inputs().find(n=>n.props.value==='exactname').props.onChange({target:{value:'ExactName'}});h.render();assert.equal(h.button('Löschung bestätigen').props.disabled,false);
 assert.equal(h.calls.filter(c=>c.path.endsWith('/execute')).length,0);h.button('Löschung bestätigen').props.onClick();await h.flush();
 assert.deepEqual(h.calls.at(-1),{path:'/admin/players/execute',body:{network:'testnet',token:'a'.repeat(48),confirmUsername:'ExactName',confirm:true,playerRequestedDeletion:true}});
 assert.equal(h.button('Löschung bestätigen'),undefined);h.unmount();
});
test('cancelling a score review sends no deletion request and late lookup cannot revive an unmounted panel',async()=>{
 const h=panel();await h.find();h.button('Highscores löschen').props.onClick();await h.flush();h.button('Abbrechen').props.onClick();h.render();assert.equal(h.calls.some(c=>c.path.endsWith('/execute')),false);assert.equal(h.button('Löschung bestätigen'),undefined);
 let reply;h.env.axiosClient.post=()=>new Promise(resolve=>{reply=resolve;});h.nodes().find(n=>n.type==='form').props.onSubmit({preventDefault(){}});h.unmount();reply({data:{players:[player]}});await h.flush();
 assert.equal(h.calls.filter(c=>c.path.endsWith('/execute')).length,0);
});
