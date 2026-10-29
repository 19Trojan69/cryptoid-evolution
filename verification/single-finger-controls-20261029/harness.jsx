import React, {useLayoutEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {bindGameInput} from '../../frontend/src/pages/gameInput';
import {lockGameViewport} from '../../frontend/src/lib/gameViewport';

function InputBoundary() {
  const field = useRef(null), input = useRef(null), pointer = useRef(null), origin = useRef(null);
  const running = useRef(true), opens = useRef(0), moves = useRef(0), faults = useRef([]);
  const trace = useRef([]);
  const [playing, setPlaying] = useState(true), [position, setPosition] = useState({x:.7,y:.8});
  const open = () => { opens.current++; running.current = false; input.current.reset(); setPlaying(false); };
  useLayoutEffect(() => {
    const observe=event=>{const row={type:event.type,id:event.pointerId,source:event.pointerType,primary:event.isPrimary,
      detail:event.detail,target:event.target.id};queueMicrotask(()=>{row.prevented=event.defaultPrevented;trace.current.push(row);trace.current=trace.current.slice(-24);});};
    const events=['pointerdown','pointerup','pointercancel','lostpointercapture','click'];
    events.forEach(type=>window.addEventListener(type,observe,true));
    const release = lockGameViewport(field.current);
    input.current = bindGameInput(field.current, {pointer, origin, playing:() => running.current,
      aboveFinger:() => false, sensitivity:() => 1, area:() => 'wide',
      position:p => {moves.current++;setPosition(p);}, fault:e => faults.current.push(e.name)});
    window.__singleFingerQA = {inspect:() => ({playing:running.current,opens:opens.current,moves:moves.current,
      pointer:pointer.current,faults:faults.current.slice(),trace:trace.current.slice()})};
    return () => {events.forEach(type=>window.removeEventListener(type,observe,true));input.current.dispose();release();delete window.__singleFingerQA;};
  }, []);
  return <main ref={field} className="game-field" style={{position:'fixed',inset:0,touchAction:playing?'none':'pan-y',background:'#061726',color:'white'}}>
    <h1 style={{font:'20px sans-serif',margin:20}}>Single-finger input boundary QA</h1>
    <p style={{margin:20}}>Real input binding and React event delegation; synthetic game state.</p>
    <div style={{position:'absolute',left:`${position.x*100}%`,top:`${position.y*100}%`,width:20,height:20,borderRadius:'50%',background:'#ffd880',pointerEvents:'none'}}/>
    {playing ? <>
      <button id="home" onClick={open} style={{position:'absolute',left:20,top:100}}>Home</button>
      <button id="pause" onClick={open} style={{position:'absolute',right:20,top:100}}>Pause</button>
      <button id="weapons" className="mission-shop-access" onClick={open} style={{position:'absolute',left:20,bottom:30,width:100,height:65}}>Weapons</button>
    </> : <section className="game-overlay" style={{position:'absolute',inset:100,background:'#19344a',padding:20}}>
      <h2>Weapons</h2>
      <div className="game-modal" data-game-scroll style={{height:260,overflowY:'auto',touchAction:'pan-y'}}>
        {Array.from({length:30},(_,i)=><p key={i}>Scrollable offer {i+1}</p>)}
      </div>
      <button id="resume" onClick={() => {running.current=true;input.current.reset();setPlaying(true);}}>Resume</button>
    </section>}
  </main>;
}
createRoot(document.getElementById('root')).render(<InputBoundary/>);
