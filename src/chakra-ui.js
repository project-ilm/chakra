/*!
 * chakra-ui.js — CHAKRA rendering & interaction layer. Consumes chakra-core (library)
 * and chakra-kernel (facade). Pure DOM/SVG; every graph is an input; inverse-first.
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
 * SPDX-License-Identifier: GPL-3.0-or-later
 * DISCLAIMER: study/heritage computation only; not for navigation or safety-critical use.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./chakra-core.js"), require("./chakra-kernel.js"));
  else root.ChakraUI = factory(root.Chakra, root.ChakraKernel);
})(typeof self !== "undefined" ? self : this, function (CK, Kernel) {
  "use strict";
  /* ---- bridge: library functions as bare names so the render code reads cleanly ---- */
  var NS="http://www.w3.org/2000/svg";
  var rev=CK.rev,S=CK.S,C=CK.C,Tn=CK.Tn,atan2d=CK.atan2d,TAU=CK.TAU,D2R=CK.D2R,R2D=CK.R2D;
  var angsep=function(a,b){var d=Math.abs(rev(a)-rev(b))%360;return d>180?360-d:d;};
  var dayNo=CK.dayNo,sunLon=CK.sunLon,moonLon=CK.moonLon,planetLon=CK.planetLon,grahas=CK.grahas,helio=CK.helio,
      kepler=CK.kepler,obliq=CK.obliq,gmst=CK.gmst,ayan=CK.ayan,ascendant=CK.ascendant,mcLon=CK.mcLon,
      altOf=CK.altOf,altAz=CK.altAz,moonLatf=CK.moonLatf,phaseInfo=CK.phaseInfo,retro=CK.retro,panchanga=CK.panchanga,
      checkEcl=CK.checkEcl,eclipses=CK.eclipses,elongOf=CK.elongOf,solveElong=CK.solveElong,solveAsc=CK.solveAsc,
      phaseLockEpoch=CK.phaseLockEpoch,findCross=CK.findCross,meshaDay=CK.meshaDay,nowruzDay=CK.nowruzDay,
      solarHijri=CK.solarHijri,samvInfo=CK.samvInfo,greg2hijri=CK.greg2hijri,chineseYear=CK.chineseYear,
      tibetYear=CK.tibetYear,mayan=CK.mayan,astroAge=CK.astroAge,d2date=CK.d2date,rayleigh=CK.rayleigh,
      nearestNamed=CK.nearestNamed,returnsIn=CK.returnsIn,contFrac=CK.contFrac,convergents=CK.convergents,
      comps=CK.comps,parseEvents=CK.parseEvents,buildChart=CK.buildChart,computeYogas=CK.computeYogas,
      vimshottari=CK.vimshottari,telescope=CK.telescope,ephemerisTable=CK.ephemerisTable,annualEvents=CK.annualEvents,
      hebrew=CK.hebrew,nanakshahi=CK.nanakshahi,hijriSunni=CK.hijriSunni,hijriShia=CK.hijriShia,
      greg2jdn=CK.greg2jdn,jdn2greg=CK.jdn2greg,jdnOf=CK.jdnOf,decYear=CK.decYear,yearToDate=CK.yearToDate,jdOf=CK.jdOf;
  var RASHI=CK.RASHI,NAK=CK.NAK,VARA=CK.VARA,TITHI=CK.TITHI,YOGA=CK.YOGA,MANAZIL=CK.MANAZIL,SAMV=CK.SAMV,
      HIJRI_M=CK.HIJRI_M,SIGN_CELL=CK.SIGN_CELL,GRAHA_GLYPH=CK.GRAHA_GLYPH,GRAHA_COL=CK.GRAHA_COL,
      CYCLES=CK.CYCLES,STARS=CK.STARS,COAST=CK.COAST,ELEM=CK.ELEM,gmst=CK.gmst,obliq=CK.obliq;


"use strict";



/* ---------------- cycle library ---------------- */
const CYMAP={}; CYCLES.forEach(c=>CYMAP[c.k]=c);
const DEFAULT_ON=["jupiter","saturn","nodes","uranus","vimsottari","yogini","rashi"];


/* ---------------- ephemeris (Schlyter low-precision, verified) ---------------- */
// full graha set (tropical longitudes) at day number d

/* ---------------- helpers ---------------- */

/* ---------------- state ---------------- */
const state={varga:1,chartStyle:"south",
  events:[], tol:1, anchor:1990,
  on:new Set(DEFAULT_ON), waveform:"sine", orbmode:"sch", showSum:true,
  refDate:"2026-07-04", refTime:"12:00", tz:5.5, lat:28.61, lon:77.21, zodiac:"sidereal",
  view:"orrery",
};

function refDayNo(){
  const [Y,M,D]=state.refDate.split("-").map(Number);
  const [h,mi]=state.refTime.split(":").map(Number);
  const UT=(h+mi/60)-state.tz;
  return dayNo(Y,M,D,UT);
}

/* ---------------- SVG helpers ---------------- */
function E(tag,at,kids){const n=document.createElementNS(NS,tag);for(const k in at)n.setAttribute(k,at[k]);if(kids)for(const c of kids)n.appendChild(c);return n;}
function T(x,y,s,at){const t=E("text",Object.assign({x,y},at||{}));t.textContent=s;return t;}
function clr(id){const s=document.getElementById(id);while(s.firstChild)s.removeChild(s.firstChild);return s;}

/* ---------------- Rayleigh coherence ---------------- */
function activeCycles(){return CYCLES.filter(c=>state.on.has(c.k));}

/* ---------------- cycle chips + moment ---------------- */
function renderChips(){
  const box=document.getElementById("cycleChips");box.innerHTML="";
  CYCLES.forEach(c=>{
    const on=state.on.has(c.k);
    const d=document.createElement("div");d.className="chip"+(on?" on":"");
    if(on){d.style.background=c.c;d.style.borderColor=c.c;d.style.color="#05070e";}
    d.innerHTML=`<span class="g">${c.g}</span>${c.nm} <span style="opacity:.7">${c.P<10?c.P.toFixed(1):Math.round(c.P)}y</span>`;
    d.onclick=()=>{if(on)state.on.delete(c.k);else state.on.add(c.k);renderAll();};
    box.appendChild(d);
  });
}
function refYear(){const [Y,M,D]=state.refDate.split("-").map(Number);const [h,mi]=state.refTime.split(":").map(Number);return decYear(new Date(Date.UTC(Y,M-1,D,h,mi)));}
function siderealAdj(lon,y){return state.zodiac==="sidereal"?rev(lon-ayan(y)):lon;}
function renderMoment(){
  const d=refDayNo(),y=refYear();
  const g=grahas(d);
  const su=siderealAdj(g.Sun,y), mo=siderealAdj(g.Moon,y);
  document.getElementById("momentRead").innerHTML=
    `<span style="color:var(--sun)">☉</span> ${RASHI[Math.floor(su/30)][0]} ${(su%30).toFixed(0)}° &nbsp; `+
    `<span style="color:var(--moon)">☾</span> ${RASHI[Math.floor(mo/30)][0]} ${(mo%30).toFixed(0)}° &nbsp; `+
    `<span style="color:var(--dim)">${NAK[Math.floor(mo/(360/27))]}</span>`;
}

/* ---------------- ORRERY (geared, draggable) ---------------- */
function orreryRingRadii(){
  const cyc=activeCycles().slice().sort((a,b)=>a.P-b.P);
  const rMin=70,rMax=292,n=cyc.length;
  return cyc.map((c,i)=>Object.assign({},c,{r: n===1?(rMin+rMax)/2 : rMin+(rMax-rMin)*i/(n-1)}));
}
let drag=null;
function kepE(M,e){let E=M+e*R2D*S(M)*(1+e*C(M));for(let i=0;i<7;i++)E=E-(E-e*R2D*S(E)-M)/(1-e*C(E));return E;}
function helioXY(nm,d){const el=ELEM[nm](d);const E=kepE(rev(el.M),el.e);
  const xv=el.a*(C(E)-el.e),yv=el.a*Math.sqrt(1-el.e*el.e)*S(E);
  const v=atan2d(yv,xv),r=Math.hypot(xv,yv),l=v+el.w;
  return {x:r*(C(el.N)*C(l)-S(el.N)*S(l)*C(el.i)),y:r*(S(el.N)*C(l)+C(el.N)*S(l)*C(el.i)),r};}
function renderOrbits(svg,cx,cy){
  const d=refDayNo();
  const PL=[["Mercury","☿","var(--merc)"],["Venus","♀","var(--ven)"],["Earth","⊕","var(--cy2)"],["Mars","♂","var(--mars)"],["Jupiter","♃","var(--jup)"],["Saturn","♄","var(--sat)"],["Uranus","♅","var(--ura)"],["Neptune","♆","var(--nep)"]];
  const aMax=30.2,Rmax=298,sc=r=>Rmax*Math.sqrt(r/aMax);
  svg.appendChild(E("circle",{cx,cy,r:7,fill:"var(--sun)",style:"filter:drop-shadow(0 0 10px var(--sun))"}));
  PL.forEach(([nm,gl,col])=>{
    const elf=nm==="Earth"?(dd=>{const s=ELEM.Sun(dd);return {N:0,i:0,w:rev(s.w+180),a:1.0,e:s.e,M:s.M};}):ELEM[nm];
    const el=elf(d);
    const pt=v=>{const r=el.a*(1-el.e*el.e)/(1+el.e*C(v)),l=v+el.w;
      const x=r*(C(el.N)*C(l)-S(el.N)*S(l)*C(el.i)),y=r*(S(el.N)*C(l)+C(el.N)*S(l)*C(el.i));
      const Rp=sc(Math.hypot(x,y)),th=atan2d(y,x);
      return [cx+Rp*C(th),cy-Rp*S(th),r];};
    let pp="";for(let v=0;v<=360;v+=3){const q=pt(v);pp+=(v?"L":"M")+q[0].toFixed(1)+" "+q[1].toFixed(1)+" ";}
    svg.appendChild(E("path",{d:pp+"Z",fill:"none",stroke:col,"stroke-opacity":.5,"stroke-width":1.1}));
    const [px,py,pr]=pt(0),[ax,ay,ar]=pt(180);
    svg.appendChild(E("circle",{cx:px,cy:py,r:2.2,fill:col}));
    svg.appendChild(E("circle",{cx:ax,cy:ay,r:2.2,fill:"none",stroke:col}));
    if(nm==="Mercury"||nm==="Mars"||nm==="Earth"||nm==="Neptune"){
      svg.appendChild(T(px+4,py-2,"p "+pr.toFixed(pr<2?3:1)+" AU",{fill:col,"font-size":7.5,"font-family":"var(--mono)","fill-opacity":.85}));
      svg.appendChild(T(ax+4,ay-2,"a "+ar.toFixed(ar<2?3:1)+" AU",{fill:col,"font-size":7.5,"font-family":"var(--mono)","fill-opacity":.85}));}
    const hp=nm==="Earth"?(()=>{const s=helioXY("Sun",d);return {x:-s.x,y:-s.y};})():helioXY(nm,d);
    const Rp=sc(Math.hypot(hp.x,hp.y)),th=atan2d(hp.y,hp.x);
    svg.appendChild(T(cx+Rp*C(th),cy-Rp*S(th)+5,gl,{fill:col,"font-size":15,"text-anchor":"middle","font-family":"var(--mono)",style:`filter:drop-shadow(0 0 5px ${col})`}));
    svg.appendChild(T(cx+Rp*C(th),cy-Rp*S(th)+17,nm,{fill:col,"font-size":7.5,"text-anchor":"middle","font-family":"var(--mono)","fill-opacity":.75}));});
  svg.appendChild(T(cx,608,"true orbital ellipses at the reference epoch · ● perihelion p · ○ aphelion a · radial scale ∝ √AU (else Mercury vanishes beside Neptune)",{fill:"var(--faint)","font-size":8.5,"text-anchor":"middle","font-family":"var(--mono)"}));
  svg.appendChild(T(cx,622,"eccentric shapes and orientation from Keplerian elements — see docs/ASSUMPTIONS.md",{fill:"var(--faint)","font-size":8,"text-anchor":"middle","font-family":"var(--mono)"}));
}
function renderOrrery(){
  const svg=clr("orrery"); const cx=320,cy=320;
  if(state.orbmode==="true"){renderOrbits(svg,cx,cy);return;}
  const rings=orreryRingRadii(); const evT=state.events.map(e=>e.t), ry=refYear();
  for(const a of [0,90,180,270]){const ang=(-90+a)*D2R;svg.appendChild(E("line",{x1:cx,y1:cy,x2:cx+300*Math.cos(ang),y2:cy+300*Math.sin(ang),stroke:"rgba(90,110,150,.10)"}));}
  svg.appendChild(E("circle",{cx,cy,r:54,fill:"none",stroke:"rgba(70,199,214,.14)"}));
  // phase-0 top marker
  svg.appendChild(E("path",{d:`M ${cx-6} 20 L ${cx+6} 20 L ${cx} 30 Z`,fill:"rgba(70,199,214,.5)"}));
  svg.appendChild(T(cx,cy-8,"EPOCH",{fill:"var(--cy2)","font-size":10,"text-anchor":"middle","letter-spacing":"3","font-family":"var(--mono)"}));
  svg.appendChild(T(cx,cy+9,state.anchor.toFixed(1),{fill:"var(--ink)","font-size":15,"text-anchor":"middle","font-family":"var(--mono)"}));
  svg.appendChild(T(cx,cy+24,"now → "+state.refDate,{fill:"var(--faint)","font-size":8.5,"text-anchor":"middle","font-family":"var(--mono)"}));
  if(!rings.length){svg.appendChild(T(cx,cy+52,"select active cycles",{fill:"var(--dim)","font-size":12,"text-anchor":"middle"}));return;}
  rings.forEach(c=>{
    const r=c.r, {R}=rayleigh(evT,c.P,1), glow=R>0.55, grabbed=drag&&drag.k===c.k;
    svg.appendChild(E("circle",{cx,cy,r,fill:"none",stroke:grabbed?"var(--cy2)":c.c,"stroke-width":grabbed?2.6:(glow?2:1),"stroke-opacity":grabbed?1:(0.18+0.5*R),style:(glow||grabbed)?`filter:drop-shadow(0 0 ${grabbed?8:6}px ${grabbed?"var(--cy)":c.c})`:""}));
    evT.forEach(t=>{const ph=(((t-state.anchor)/c.P)%1+1)%1,a=(-90+ph*360)*D2R;
      svg.appendChild(E("circle",{cx:cx+r*Math.cos(a),cy:cy+r*Math.sin(a),r:2.7,fill:"var(--amber)","fill-opacity":.92}));});
    const pn=(((ry-state.anchor)/c.P)%1+1)%1,an=(-90+pn*360)*D2R;
    svg.appendChild(E("line",{x1:cx+(r-5)*Math.cos(an),y1:cy+(r-5)*Math.sin(an),x2:cx+(r+5)*Math.cos(an),y2:cy+(r+5)*Math.sin(an),stroke:"var(--cy2)","stroke-width":2}));
    svg.appendChild(E("circle",{cx:cx+r*Math.cos(an),cy:cy+r*Math.sin(an),r:3.2,fill:"var(--cy2)",style:"filter:drop-shadow(0 0 5px var(--cy))"}));
    const lx=cx-r-4;
    svg.appendChild(T(lx,cy-2,c.g,{fill:c.c,"font-size":13,"text-anchor":"end","font-family":"var(--mono)"}));
    svg.appendChild(T(lx,cy+9,(c.P<10?c.P.toFixed(1):Math.round(c.P))+"y",{fill:"var(--dim)","font-size":8.5,"text-anchor":"end","font-family":"var(--mono)"}));
    if(R>0.5)svg.appendChild(T(cx+r+3,cy+3,"r="+R.toFixed(2),{fill:"var(--grn)","font-size":8.5,"font-family":"var(--mono)"}));
  });
}
function renderOrreryWave(){
  const svg=clr("orreryWave"); const cyc=activeCycles(); const wf=WAVE[state.waveform];
  const [a,b]=waveRange(); const W=620,padL=34,padR=12,iw=W-padL-padR;
  const laneH=Math.max(30,Math.min(50,(560-70)/Math.max(1,cyc.length))), sumH=64;
  const H=18+cyc.length*laneH+sumH+18; svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  const X=t=>padL+(t-a)/(b-a)*iw, N=560;
  // epoch line + event lines
  if(state.anchor>=a&&state.anchor<=b){const ex=X(state.anchor);svg.appendChild(E("line",{x1:ex,y1:12,x2:ex,y2:H-12,stroke:"var(--cy2)","stroke-opacity":.5,"stroke-width":1.5}));svg.appendChild(T(ex,10,"epoch",{fill:"var(--cy2)","font-size":8,"text-anchor":"middle","font-family":"var(--mono)"}));}
  state.events.forEach(e=>{const x=X(e.t);svg.appendChild(E("line",{x1:x,y1:14,x2:x,y2:H-14,stroke:"var(--amber)","stroke-opacity":.24,"stroke-dasharray":"2 4"}));});
  {let step=1;const sp=b-a;for(const s of [1,2,5,10,20,25,50,100,200])if(sp/s<=10){step=s;break;}
   for(let yv=Math.ceil(a/step)*step;yv<=b;yv+=step){const x=X(yv);
     svg.appendChild(E("line",{x1:x,y1:14,x2:x,y2:H-15,stroke:"rgba(90,110,150,.09)"}));
     svg.appendChild(T(x,H-3,String(Math.round(yv)),{fill:"var(--dim)","font-size":10,"text-anchor":"middle","font-family":"var(--mono)"}));}
   svg.appendChild(T(padL-6,H-3,"yr",{fill:"var(--faint)","font-size":9,"text-anchor":"end","font-family":"var(--mono)"}));}
  if(!cyc.length){svg.appendChild(T(W/2,80,"select active cycles",{fill:"var(--dim)","font-size":12,"text-anchor":"middle"}));return;}
  const rect=state.waveform==="rectified";
  cyc.forEach((c,li)=>{const mid=18+li*laneH+laneH/2, amp=laneH/2-7;
    svg.appendChild(T(5,mid+4,c.g,{fill:c.c,"font-size":12,"font-family":"var(--mono)"}));
    svg.appendChild(E("line",{x1:padL,y1:mid+(rect?amp:0),x2:W-padR,y2:mid+(rect?amp:0),stroke:"rgba(90,110,150,.12)"}));
    let dp="";for(let k=0;k<=N;k++){const t=a+(b-a)*k/N,v=wf((t-state.anchor)/c.P),y=rect?mid+amp-v*2*amp:mid-v*amp;dp+=(k?"L":"M")+X(t).toFixed(1)+" "+y.toFixed(1)+" ";}
    svg.appendChild(E("path",{d:dp,fill:"none",stroke:c.c,"stroke-width":1.3,"stroke-opacity":.9}));});
  const top=18+cyc.length*laneH, mid=top+sumH/2, amp=sumH/2-9;
  svg.appendChild(T(5,mid+4,"Σ",{fill:"var(--cy2)","font-size":14,"font-family":"var(--mono)"}));
  let mA=1e-4;const smp=[];for(let k=0;k<=N;k++){const t=a+(b-a)*k/N;let s=0;cyc.forEach(c=>s+=wf((t-state.anchor)/c.P));smp.push(s);if(Math.abs(s)>mA)mA=Math.abs(s);}
  let dp="";smp.forEach((s,k)=>{const t=a+(b-a)*k/N,y=mid-(s/mA)*amp;dp+=(k?"L":"M")+X(t).toFixed(1)+" "+y.toFixed(1)+" ";});
  svg.appendChild(E("line",{x1:padL,y1:mid,x2:W-padR,y2:mid,stroke:"rgba(90,110,150,.16)"}));
  svg.appendChild(E("path",{d:dp,fill:"none",stroke:"var(--cy2)","stroke-width":2,style:"filter:drop-shadow(0 0 4px var(--cy))"}));
}
function reflectEpoch(){const v=state.anchor,s=document.getElementById("epochSlider");
  if(s){if(+s.min>v-1)s.min=Math.floor(v-30);if(+s.max<v+1)s.max=Math.ceil(v+30);s.value=v;}
  const ev=document.getElementById("epochVal");if(ev)ev.textContent=v.toFixed(1);
  const an=document.getElementById("anchor");if(an&&document.activeElement!==an)an.value=Math.round(v*10)/10;}
function renderInstrument(){renderOrrery();renderOrreryWave();reflectEpoch();renderMomCards();}
function svgGeom(ev){const svg=document.getElementById("orrery");const r=svg.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;const dx=ev.clientX-cx,dy=ev.clientY-cy;return{ang:Math.atan2(dy,dx),rad:Math.hypot(dx,dy)/(r.width/640)};}
function setupOrreryDrag(){
  const svg=document.getElementById("orrery"); if(!svg)return;
  document.querySelectorAll(".orbsel button").forEach(b=>b.onclick=()=>{state.orbmode=b.dataset.o;document.querySelectorAll(".orbsel button").forEach(x=>x.classList.toggle("on",x===b));renderInstrument();});
  svg.addEventListener("pointerdown",ev=>{
    if(state.orbmode==="true")return;
    const rings=orreryRingRadii(); if(!rings.length)return;
    const {ang,rad}=svgGeom(ev); let best=null,bd=1e9;
    rings.forEach(rr=>{const dd=Math.abs(rr.r-rad);if(dd<bd){bd=dd;best=rr;}});
    if(bd>36)return;
    drag={P:best.P,k:best.k,prev:ang,turns:0,epoch0:state.anchor,raf:0};
    try{svg.setPointerCapture(ev.pointerId);}catch(e){} svg.style.cursor="grabbing"; ev.preventDefault();
  });
  svg.addEventListener("pointermove",ev=>{
    if(!drag)return;
    const {ang}=svgGeom(ev); let d=ang-drag.prev; if(d>Math.PI)d-=TAU; if(d<-Math.PI)d+=TAU; drag.prev=ang; drag.turns+=d/TAU;
    state.anchor=drag.epoch0 - drag.turns*drag.P; reflectEpoch();
    if(!drag.raf)drag.raf=requestAnimationFrame(()=>{renderInstrument();if(drag)drag.raf=0;});
    ev.preventDefault();
  });
  const end=()=>{if(drag){drag=null;svg.style.cursor="grab";renderInstrument();}};
  svg.addEventListener("pointerup",end); svg.addEventListener("pointercancel",end);
}

/* ---------------- TIMELINE STAVE ---------------- */
function renderStave(){
  const svg=clr("stave"); const cyc=activeCycles();
  if(!state.events.length){svg.appendChild(T(560,80,"paste events above",{fill:"var(--dim)","font-size":13,"text-anchor":"middle"}));return;}
  let ymin=Math.min(...state.events.map(e=>e.t))-2, ymax=Math.max(...state.events.map(e=>e.t))+2; if(ymax===ymin)ymax++;
  const W=1160,padL=54,padR=24,iw=W-padL-padR,topH=48,laneH=30,botH=28;
  const H=topH+cyc.length*laneH+botH; svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  const X=y=>padL+(y-ymin)/(ymax-ymin)*iw; const axisY=topH+cyc.length*laneH+6;
  svg.appendChild(E("line",{x1:padL,y1:axisY,x2:W-padR,y2:axisY,stroke:"rgba(90,110,150,.3)","stroke-width":1}));
  let step=1;const sp=ymax-ymin;for(const s of [1,2,5,10,20,25,50,100])if(sp/s<=16){step=s;break;}
  for(let y=Math.ceil(ymin/step)*step;y<=ymax;y+=step){const x=X(y);svg.appendChild(E("line",{x1:x,y1:axisY,x2:x,y2:axisY+4,stroke:"var(--faint)"}));svg.appendChild(T(x,axisY+17,String(Math.round(y)),{fill:"var(--dim)","font-size":10,"text-anchor":"middle","font-family":"var(--mono)"}));}
  svg.appendChild(T(W-padR+16,axisY+17,"yr",{fill:"var(--faint)","font-size":9,"text-anchor":"start","font-family":"var(--mono)"}));
  // events
  state.events.forEach(e=>{const x=X(e.t);svg.appendChild(E("line",{x1:x,y1:topH-6,x2:x,y2:axisY,stroke:"var(--amber)","stroke-opacity":.28}));
    svg.appendChild(E("path",{d:`M ${x-5} ${topH-18} L ${x+5} ${topH-18} L ${x} ${topH-9} Z`,fill:"var(--amber)"}));
    if(e.label)svg.appendChild(T(x,topH-22,e.label.slice(0,14),{fill:"var(--amber)","font-size":8.5,"text-anchor":"middle","font-family":"var(--mono)"}));
    else svg.appendChild(T(x,topH-22,String(Math.round(e.t)),{fill:"var(--amber)","font-size":9,"text-anchor":"middle","font-family":"var(--mono)"}));});
  // conjunction bands
  const ev=[];cyc.forEach((c,i)=>returnsIn(c.P,state.anchor,ymin,ymax).forEach(t=>ev.push({t,i})));ev.sort((a,b)=>a.t-b.t);
  const ct=Math.max(state.tol,0.5);
  for(let i=0;i<ev.length;i++){let j=i,ids=new Set();while(j<ev.length&&ev[j].t-ev[i].t<=ct){ids.add(ev[j].i);j++;}if(ids.size>=2){const x=X((ev[i].t+ev[j-1].t)/2);svg.appendChild(E("line",{x1:x,y1:topH-2,x2:x,y2:axisY,stroke:"var(--grn)","stroke-opacity":.5,"stroke-dasharray":"2 3"}));}}
  const eT=state.events.map(e=>e.t);
  cyc.forEach((c,li)=>{const base=topH+li*laneH+16;
    svg.appendChild(T(4,base+4,c.g,{fill:c.c,"font-size":12,"font-family":"var(--mono)"}));
    svg.appendChild(E("line",{x1:X(ymin),y1:base,x2:X(ymax),y2:base,stroke:c.c,"stroke-opacity":.14}));
    returnsIn(c.P,state.anchor,ymin,ymax).forEach(t=>{const hit=eT.some(m=>Math.abs(m-t)<=state.tol);
      svg.appendChild(E("line",{x1:X(t),y1:base-5,x2:X(t),y2:base+5,stroke:hit?"var(--grn)":c.c,"stroke-width":hit?2:1,"stroke-opacity":hit?1:.5}));});
  });
}

/* ---------------- WAVEFORMS ---------------- */
const WAVE={
  sine:u=>Math.cos(TAU*u),
  rectified:u=>Math.abs(Math.cos(TAU*u)),
  square:u=>Math.cos(TAU*u)>=0?1:-1,
  triangle:u=>1-4*Math.abs(((u+0.5)%1+1)%1-0.5),
  saw:u=>2*(((u+0.5)%1+1)%1)-1,
};
function waveRange(){let a,b;if(state.events.length>=2){a=Math.min(...state.events.map(e=>e.t));b=Math.max(...state.events.map(e=>e.t));const pad=(b-a)*0.08+1;a-=pad;b+=pad;}else{a=state.anchor-8;b=state.anchor+40;}return[a,b];}
function renderWave(){
  const svg=clr("wave"); const cyc=activeCycles(); const wf=WAVE[state.waveform];
  const [a,b]=waveRange(); const W=1160,padL=54,padR=20,iw=W-padL-padR;
  const laneH=44, sumH=state.showSum?70:0;
  const H=26+cyc.length*laneH+sumH+22; svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  const X=t=>padL+(t-a)/(b-a)*iw; const N=Math.min(900,Math.max(300,Math.floor(iw)));
  // event verticals
  state.events.forEach(e=>{const x=X(e.t);svg.appendChild(E("line",{x1:x,y1:16,x2:x,y2:H-16,stroke:"var(--amber)","stroke-opacity":.22,"stroke-dasharray":"2 4"}));});
  /* X axis: labelled years */
  {const axY=H-5;let step=1;const sp=(b-a);for(const s of [1,2,5,10,20,25,50,100,200])if(sp/s<=14){step=s;break;}
   for(let yv=Math.ceil(a/step)*step;yv<=b;yv+=step){const x=X(yv);
     svg.appendChild(E("line",{x1:x,y1:24,x2:x,y2:H-16,stroke:"rgba(90,110,150,.07)"}));
     svg.appendChild(T(x,axY,String(Math.round(yv)),{fill:"var(--dim)","font-size":9,"text-anchor":"middle","font-family":"var(--mono)"}));}
   svg.appendChild(T(W-padR,axY,"year (CE) \u2192",{fill:"var(--faint)","font-size":9,"text-anchor":"end","font-family":"var(--mono)"}));}
  if(!cyc.length){svg.appendChild(T(560,80,"select active cycles",{fill:"var(--dim)","font-size":13,"text-anchor":"middle"}));return;}
  const rectified=state.waveform==="rectified";
  cyc.forEach((c,li)=>{const mid=26+li*laneH+laneH/2, amp=laneH/2-8;
    svg.appendChild(T(6,mid+4,c.g,{fill:c.c,"font-size":13,"font-family":"var(--mono)"}));
    svg.appendChild(E("line",{x1:padL,y1:mid+(rectified?amp:0),x2:W-padR,y2:mid+(rectified?amp:0),stroke:"rgba(90,110,150,.14)"}));
    let dpath="";for(let k=0;k<=N;k++){const t=a+(b-a)*k/N;const v=wf(((t-state.anchor)/c.P));const y=rectified?mid+amp-v*2*amp:mid-v*amp;dpath+=(k?"L":"M")+X(t).toFixed(1)+" "+y.toFixed(1)+" ";}
    svg.appendChild(E("path",{d:dpath,fill:"none",stroke:c.c,"stroke-width":1.4,"stroke-opacity":.9}));
  });
  if(state.showSum){const top=26+cyc.length*laneH; const mid=top+sumH/2, amp=sumH/2-10;
    svg.appendChild(T(6,mid+4,"Σ",{fill:"var(--cy2)","font-size":15,"font-family":"var(--mono)"}));
    // normalize sum
    let maxAbs=0.0001;const samp=[];for(let k=0;k<=N;k++){const t=a+(b-a)*k/N;let s=0;cyc.forEach(c=>s+=wf(((t-state.anchor)/c.P)));samp.push(s);if(Math.abs(s)>maxAbs)maxAbs=Math.abs(s);}
    let dp="";samp.forEach((s,k)=>{const t=a+(b-a)*k/N;const y=mid-(s/maxAbs)*amp;dp+=(k?"L":"M")+X(t).toFixed(1)+" "+y.toFixed(1)+" ";});
    svg.appendChild(E("line",{x1:padL,y1:mid,x2:W-padR,y2:mid,stroke:"rgba(90,110,150,.18)"}));
    svg.appendChild(E("path",{d:dp,fill:"none",stroke:"var(--cy2)","stroke-width":2,style:"filter:drop-shadow(0 0 4px var(--cy))"}));
  }
}

/* ---------------- SPECTRUM (Rayleigh) ---------------- */
function computeSpectrum(){
  const evT=state.events.map(e=>e.t); const harm=state.waveform==="rectified"?2:1;
  const span=evT.length>1?Math.max(...evT)-Math.min(...evT):100;
  const Pmin=2, Pmax=Math.min(400,Math.max(60,span*1.3));
  const M=640, pts=[];
  for(let i=0;i<=M;i++){const P=Pmin*Math.pow(Pmax/Pmin,i/M);pts.push({P,R:rayleigh(evT,P,harm).R});}
  // peaks
  const peaks=[];for(let i=2;i<pts.length-2;i++){if(pts[i].R>pts[i-1].R&&pts[i].R>pts[i+1].R&&pts[i].R>0.45)peaks.push(pts[i]);}
  peaks.sort((a,b)=>b.R-a.R);const kept=[];for(const p of peaks){if(kept.some(k=>Math.abs(k.P-p.P)/p.P<0.08))continue;kept.push(p);if(kept.length>=6)break;}
  return {pts,Pmin,Pmax,peaks:kept};
}
function renderSpectrum(){
  const svg=clr("spectrum"); const W=1160,H=400,padL=48,padR=20,padT=18,padB=40,iw=W-padL-padR,ih=H-padT-padB;
  svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
  if(state.events.length<2){svg.appendChild(T(560,180,"need ≥2 events",{fill:"var(--dim)","font-size":13,"text-anchor":"middle"}));document.getElementById("spectrumRead").textContent="";return;}
  const {pts,Pmin,Pmax,peaks}=computeSpectrum();
  const X=P=>padL+(Math.log(P)-Math.log(Pmin))/(Math.log(Pmax)-Math.log(Pmin))*iw;
  const Y=R=>padT+ih-R*ih;
  // grid
  [0,.25,.5,.75,1].forEach(r=>{svg.appendChild(E("line",{x1:padL,y1:Y(r),x2:W-padR,y2:Y(r),stroke:"rgba(90,110,150,.12)"}));svg.appendChild(T(padL-6,Y(r)+3,r.toFixed(2),{fill:"var(--faint)","font-size":9,"text-anchor":"end","font-family":"var(--mono)"}));});
  [2,3,5,10,20,30,50,100,200,400].forEach(P=>{if(P<Pmin||P>Pmax)return;const x=X(P);svg.appendChild(E("line",{x1:x,y1:padT,x2:x,y2:padT+ih,stroke:"rgba(90,110,150,.08)"}));svg.appendChild(T(x,H-22,P+"y",{fill:"var(--faint)","font-size":9,"text-anchor":"middle","font-family":"var(--mono)"}));});
  svg.appendChild(T(padL+iw/2,H-6,"period P (years, log scale) \u2014 click a peak to phase-lock the epoch",{fill:"var(--faint)","font-size":10,"text-anchor":"middle","font-family":"var(--mono)"}));
  {const yt=T(14,padT+ih/2,"phase coherence R (Rayleigh)",{fill:"var(--faint)","font-size":10,"text-anchor":"middle","font-family":"var(--mono)"});yt.setAttribute("transform","rotate(-90 14 "+(padT+ih/2)+")");svg.appendChild(yt);}
  // named cycle guides
  CYCLES.forEach(c=>{if(c.P<Pmin||c.P>Pmax)return;const x=X(c.P);svg.appendChild(E("line",{x1:x,y1:padT,x2:x,y2:padT+ih,stroke:c.c,"stroke-opacity":.25,"stroke-dasharray":"1 4"}));svg.appendChild(T(x,padT+10,c.g,{fill:c.c,"font-size":11,"text-anchor":"middle","font-family":"var(--mono)","opacity":.7}));});
  // curve
  let dp="",fp="";pts.forEach((p,k)=>{const x=X(p.P),y=Y(p.R);dp+=(k?"L":"M")+x.toFixed(1)+" "+y.toFixed(1)+" ";fp+=(k?"L":"M")+x.toFixed(1)+" "+y.toFixed(1)+" ";});
  fp+=`L ${X(Pmax).toFixed(1)} ${Y(0)} L ${X(Pmin).toFixed(1)} ${Y(0)} Z`;
  svg.appendChild(E("path",{d:fp,fill:"rgba(70,199,214,.10)"}));
  svg.appendChild(E("path",{d:dp,fill:"none",stroke:"var(--cy2)","stroke-width":2,style:"filter:drop-shadow(0 0 5px var(--cy))"}));
  // peaks — each is an input: click to phase-lock the epoch to that period
  const evT=state.events.map(e=>e.t);const harm=state.waveform==="rectified"?2:1;
  peaks.forEach(p=>{const x=X(p.P),y=Y(p.R);const nm=nearestNamed(p.P);
    svg.appendChild(E("circle",{cx:x,cy:y,r:4,fill:"var(--grn)"}));
    svg.appendChild(T(x,y-9,p.P.toFixed(1)+"y",{fill:"var(--grn)","font-size":10,"text-anchor":"middle","font-family":"var(--mono)"}));
    if(nm)svg.appendChild(T(x,y-21,nm.g+" "+nm.nm.split(" ")[0],{fill:nm.c,"font-size":9,"text-anchor":"middle","font-family":"var(--mono)"}));
    const hit=E("circle",{cx:x,cy:y,r:14,fill:"transparent",style:"cursor:pointer"});
    hit.addEventListener("click",()=>{state.anchor=phaseLockEpoch(evT,p.P,harm,state.anchor);reflectEpoch();
      document.getElementById("spectrumRead").innerHTML=`Epoch <b>phase-locked</b> to P=${p.P.toFixed(2)}y → ${state.anchor.toFixed(2)} (waveform peaks now sit on the event cluster). Open the Observatory to see the gears aligned.`;});
    svg.appendChild(hit);});
  const rd=peaks.map(p=>{const nm=nearestNamed(p.P);return `<b>${p.P.toFixed(1)}y</b> (r=${p.R.toFixed(2)})${nm?` ≈ ${nm.g} ${nm.nm}`:``}`;}).join(" &nbsp;·&nbsp; ");
  document.getElementById("spectrumRead").innerHTML=peaks.length?("Dominant periods: "+rd):"No strong periodicity — events may be aperiodic at this tolerance.";
}

/* ---------------- DYNAMICS / CHAOS ---------------- */
function renderChaos(){
  const svg=clr("returnmap"); const cx=400;
  const t=state.events.map(e=>e.t); const d=[];for(let i=1;i<t.length;i++)d.push(t[i]-t[i-1]);
  const r1=document.getElementById("chaosRead1"), r2=document.getElementById("chaosRead2");
  if(d.length<2){svg.appendChild(T(200,200,"need ≥3 events",{fill:"var(--dim)","font-size":12,"text-anchor":"middle"}));r1.textContent="";}
  else{
    const mx=Math.max(...d)*1.15, P=40,PA=360;const X=v=>P+v/mx*PA, Y=v=>P+PA-v/mx*PA;
    // axes + diagonal
    svg.appendChild(E("line",{x1:P,y1:P+PA,x2:P+PA,y2:P+PA,stroke:"rgba(90,110,150,.3)"}));
    svg.appendChild(E("line",{x1:P,y1:P,x2:P,y2:P+PA,stroke:"rgba(90,110,150,.3)"}));
    svg.appendChild(E("line",{x1:P,y1:P+PA,x2:P+PA,y2:P,stroke:"rgba(90,110,150,.18)","stroke-dasharray":"3 3"}));
    svg.appendChild(T(P+PA,P+PA+16,"Δₙ",{fill:"var(--dim)","font-size":10,"text-anchor":"end"}));
    svg.appendChild(T(P-8,P+8,"Δₙ₊₁",{fill:"var(--dim)","font-size":10,"text-anchor":"end"}));
    [0,0.5,1].forEach(f=>{const v=mx*f,x=X(v),yv=Y(v);
      svg.appendChild(E("line",{x1:x,y1:P+PA,x2:x,y2:P+PA+4,stroke:"var(--faint)"}));
      svg.appendChild(T(x,P+PA+15,v.toFixed(v<10?1:0),{fill:"var(--dim)","font-size":9,"text-anchor":"middle","font-family":"var(--mono)"}));
      svg.appendChild(E("line",{x1:P-4,y1:yv,x2:P,y2:yv,stroke:"var(--faint)"}));
      svg.appendChild(T(P-7,yv+3,v.toFixed(v<10?1:0),{fill:"var(--dim)","font-size":9,"text-anchor":"end","font-family":"var(--mono)"}));});
    svg.appendChild(T(P+PA/2,P+PA+28,"interval Δₙ (years) — next interval vs this one",{fill:"var(--faint)","font-size":9.5,"text-anchor":"middle","font-family":"var(--mono)"}));
    // trajectory + points
    let tp="";for(let i=0;i<d.length-1;i++){const x=X(d[i]),y=Y(d[i+1]);tp+=(i?"L":"M")+x.toFixed(1)+" "+y.toFixed(1)+" ";}
    svg.appendChild(E("path",{d:tp,fill:"none",stroke:"rgba(70,199,214,.3)","stroke-width":1}));
    for(let i=0;i<d.length-1;i++){svg.appendChild(E("circle",{cx:X(d[i]),cy:Y(d[i+1]),r:4,fill:"var(--cy2)",style:"filter:drop-shadow(0 0 4px var(--cy))"}));}
    const mean=d.reduce((a,b)=>a+b,0)/d.length, cv=Math.sqrt(d.reduce((a,b)=>a+(b-mean)**2,0)/d.length)/mean;
    let det=0;for(let i=0;i<d.length-1;i++)if(Math.abs(d[i]-d[i+1])/Math.max(d[i],d[i+1])<0.12)det++;det/=(d.length-1);
    r1.innerHTML=`Intervals: <b>${d.map(x=>x.toFixed(x%1?1:0)).join(", ")}</b><br>mean <b>${mean.toFixed(1)}y</b> · CV <b>${cv.toFixed(2)}</b> · `+
      (cv<0.15?`<span style="color:var(--grn)">near-periodic</span>`:cv<0.5?`<span style="color:var(--amber)">structured but irregular</span>`:`<span style="color:var(--mag)">strongly irregular</span>`)+
      `<br>points on the diagonal → repeating interval; a closed loop → quasiperiodic; scatter → aperiodic.`;
  }
  // commensurability
  const cyc=activeCycles().slice().sort((a,b)=>b.P-a.P);
  let html="";
  if(cyc.length<2)html=`<div class="empty">Activate two or more cycles to test commensurability.</div>`;
  else{
    html+=`<p style="font-size:11.5px;color:var(--dim);margin:0 0 8px">Two cycles with an irrational period ratio never realign — their combined pattern winds a torus forever without repeating (quasiperiodic, the KAM regime). A near-rational ratio locks into resonance.</p>`;
    const pairs=[];for(let i=0;i<cyc.length;i++)for(let j=i+1;j<cyc.length;j++)pairs.push([cyc[i],cyc[j]]);
    pairs.slice(0,7).forEach(([A,B])=>{const ratio=A.P/B.P;const cf=contFrac(ratio,6);const cv=convergents(cf);
      let bigAt=1,big=0;for(let i=1;i<cf.length;i++)if(cf[i]>big){big=cf[i];bigAt=i;}
      const conv=cv[Math.max(0,bigAt-1)];const resonant=big>=8;
      html+=`<div class="kv"><span class="k">${A.g} ${A.P.toFixed(1)} : ${B.g} ${B.P.toFixed(1)}</span><span class="v">${ratio.toFixed(4)} = [${cf.join(";")}]<br><span style="color:${resonant?'var(--amber)':'var(--grn)'}">${resonant?`near ${conv[0]}:${conv[1]} resonance`:`quasiperiodic (~${conv[0]}:${conv[1]})`}</span></span></div>`;
    });
  }
  r2.innerHTML=html;
}

/* ---------------- LAGNA ---------------- */
function chartPositions(){
  const d=refDayNo(),y=refYear(),lat=state.lat,lon=state.lon;
  const g=grahas(d); const asc=ascendant(d,lat,lon);
  const adj=v=>siderealAdj(v,y);
  const pos={Asc:adj(asc)};
  ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu","Uranus","Neptune"].forEach(nm=>pos[nm]=adj(g[nm]));
  return {pos,y};
}
function renderLagna(){
  syncFine();
  const d=refDayNo(),y=refYear(),lat=state.lat,lon=state.lon;
  const rawG=grahas(d), ascRaw=ascendant(d,lat,lon), mcRaw=mcLon(d,lon);
  const BODIES=["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu","Uranus","Neptune"];
  const B={};
  BODIES.forEach(nm=>{const rawLon=rawG[nm];const beta=nm==="Moon"?moonLatf(d):0;
    const isR=(nm==="Rahu"||nm==="Ketu")?true:(["Mars","Mercury","Jupiter","Venus","Saturn","Uranus","Neptune"].includes(nm)?retro(nm,d):false);
    B[nm]={disp:siderealAdj(rawLon,y),alt:altOf(rawLon,beta,d,lat,lon),retro:isR};});
  const ascD=siderealAdj(ascRaw,y), mcD=siderealAdj(mcRaw,y);

  // ---- rasi / varga chart (south grid or north diamond; drag→house time-solve on D1) ----
  const V=state.varga||1;
  const VG_NAME={1:"D1 · Rāśi",2:"D2 · Horā",3:"D3 · Drekkāṇa",7:"D7 · Saptāṁśa",9:"D9 · Navāṁśa",10:"D10 · Daśāṁśa",12:"D12 · Dvādaśāṁśa"};
  const Bv={};BODIES.forEach(nm=>Bv[nm]=CK.vargaLon(B[nm].disp,V));
  const ascV=CK.vargaLon(ascD,V);
  const svg=clr("rasi");const inSign={};for(let s=0;s<12;s++)inSign[s]=[];
  BODIES.forEach(nm=>inSign[Math.floor(Bv[nm]/30)].push(nm));
  const ascSign=Math.floor(ascV/30);
  {const vn=document.getElementById("vgname");if(vn)vn.textContent=(VG_NAME[V]||("D"+V))+(V!==1?" — drag lives on D1":"");}
  rasiHit.cells.length=0;rasiHit.glyphs.length=0;rasiHit.style=state.chartStyle;
  if(state.chartStyle==="north"){renderNorth(svg,inSign,ascSign,B);}
  else{
    const m=18,cell=(400-2*m)/4;
    for(let s=0;s<12;s++){const [r,cx0]=SIGN_CELL[s];const x=m+cx0*cell,yy=m+r*cell;const lagna=s===ascSign;
      rasiHit.cells.push({sign:s,x:x,y:yy,w:cell,h:cell});
      svg.appendChild(E("rect",{x,y:yy,width:cell,height:cell,fill:lagna?"rgba(70,199,214,.07)":"rgba(5,9,18,.4)",stroke:lagna?"var(--cy)":"rgba(90,110,150,.28)","stroke-width":lagna?1.6:1}));
      svg.appendChild(T(x+5,yy+13,RASHI[s][1],{fill:"var(--mag)","font-size":11,"font-family":"var(--mono)","opacity":.75}));
      if(lagna)svg.appendChild(T(x+cell-5,yy+13,"La",{fill:"var(--cy2)","font-size":10,"text-anchor":"end","font-family":"var(--mono)"}));
      let gx=x+6,gy=yy+30;inSign[s].forEach((nm,k)=>{
        rasiHit.glyphs.push({nm:nm,x:gx+4,y:gy-4});
        svg.appendChild(T(gx,gy,GRAHA_GLYPH[nm],{fill:GRAHA_COL[nm],"font-size":13,"font-family":"var(--mono)","opacity":B[nm].alt>0?1:0.45}));
        if(B[nm].retro)svg.appendChild(T(gx+9,gy-6,"℞",{fill:"var(--mars)","font-size":8,"font-family":"var(--mono)"}));
        gx+=20;if((k+1)%4===0){gx=x+6;gy+=17;}});
    }
  }
  svg.appendChild(T(200,188,(VG_NAME[V]||("D"+V))+" · "+(state.zodiac==="sidereal"?"SIDEREAL":"TROPICAL"),{fill:"var(--dim)","font-size":10.5,"text-anchor":"middle","letter-spacing":"1.5","font-family":"var(--mono)"}));
  svg.appendChild(T(200,204,state.refDate+" "+state.refTime,{fill:"var(--faint)","font-size":9.5,"text-anchor":"middle","font-family":"var(--mono)"}));
  svg.appendChild(T(200,218,V===1?"drag a graha into a house — the observatory solves the time":"℞ retrograde · dim = below horizon",{fill:"var(--faint)","font-size":8,"text-anchor":"middle","font-family":"var(--mono)"}));

  // ---- sky dial ----
  const s2=clr("skydial");const cx=200,cy=200,rO=160,rI=120;
  // above-horizon shading (arc asc→desc containing MC)
  let d0=ascD, d1=ascD+180; if(rev(mcD-ascD)>=180){d0=ascD-180;d1=ascD;}
  const a0=(-90+d0)*D2R,a1=(-90+d1)*D2R;
  s2.appendChild(E("path",{d:`M ${cx+rO*Math.cos(a0)} ${cy+rO*Math.sin(a0)} A ${rO} ${rO} 0 0 1 ${cx+rO*Math.cos(a1)} ${cy+rO*Math.sin(a1)} L ${cx+rI*Math.cos(a1)} ${cy+rI*Math.sin(a1)} A ${rI} ${rI} 0 0 0 ${cx+rI*Math.cos(a0)} ${cy+rI*Math.sin(a0)} Z`,fill:"rgba(70,199,214,.06)"}));
  s2.appendChild(E("circle",{cx,cy,r:rO,fill:"none",stroke:"rgba(90,110,150,.3)"}));
  s2.appendChild(E("circle",{cx,cy,r:rI,fill:"none",stroke:"rgba(90,110,150,.18)"}));
  for(let i=0;i<12;i++){const a=(-90+i*30)*D2R;s2.appendChild(E("line",{x1:cx+rI*Math.cos(a),y1:cy+rI*Math.sin(a),x2:cx+rO*Math.cos(a),y2:cy+rO*Math.sin(a),stroke:"rgba(90,110,150,.22)"}));
    const am=(-90+(i+0.5)*30)*D2R;s2.appendChild(T(cx+((rO+rI)/2)*Math.cos(am),cy+((rO+rI)/2)*Math.sin(am)+4,RASHI[i][1],{fill:"var(--mag)","font-size":12,"text-anchor":"middle","opacity":.55,"font-family":"var(--mono)"}));}
  const aa=(-90+ascD)*D2R;s2.appendChild(E("line",{x1:cx,y1:cy,x2:cx+rO*Math.cos(aa),y2:cy+rO*Math.sin(aa),stroke:"var(--cy2)","stroke-width":2,style:"filter:drop-shadow(0 0 4px var(--cy))"}));
  s2.appendChild(T(cx+(rO+9)*Math.cos(aa),cy+(rO+9)*Math.sin(aa)+3,"Asc",{fill:"var(--cy2)","font-size":9,"text-anchor":"middle","font-family":"var(--mono)"}));
  const mm=(-90+mcD)*D2R;s2.appendChild(T(cx+(rO+9)*Math.cos(mm),cy+(rO+9)*Math.sin(mm)+3,"MC",{fill:"var(--dim)","font-size":9,"text-anchor":"middle","font-family":"var(--mono)"}));
  const rp={};BODIES.forEach(nm=>{let r=rI-14;const a=(-90+B[nm].disp)*D2R;let key=Math.round(B[nm].disp/6);while(rp[key]){r-=13;key+="_";}rp[key]=1;const vis=B[nm].alt>0;
    s2.appendChild(E("circle",{cx:cx+(rI-2)*Math.cos(a),cy:cy+(rI-2)*Math.sin(a),r:2,fill:GRAHA_COL[nm],"fill-opacity":vis?1:.4}));
    s2.appendChild(T(cx+r*Math.cos(a),cy+r*Math.sin(a)+4,GRAHA_GLYPH[nm]+(B[nm].retro?"℞":""),{fill:GRAHA_COL[nm],"font-size":12,"text-anchor":"middle","font-family":"var(--mono)","opacity":vis?1:.42}));});
  // moon icon
  const ph=phaseInfo(d);moonIcon(s2,34,34,15,ph.illum,ph.waxing);

  // ---- readout ----
  const pc=panchanga(d,y);const nak=Math.floor(B.Moon.disp/(360/27));const pada=Math.floor((B.Moon.disp%(360/27))/(360/108))+1;
  const retros=BODIES.filter(nm=>B[nm].retro).map(nm=>GRAHA_GLYPH[nm]);
  const visible=BODIES.filter(nm=>B[nm].alt>0&&nm!=="Rahu"&&nm!=="Ketu").map(nm=>GRAHA_GLYPH[nm]);
  document.getElementById("lagnaRead").innerHTML=
    `<div class="kv"><span class="k">Lagna (Ascendant)</span><span class="v">${RASHI[ascSign][0]} ${(ascD%30).toFixed(1)}°</span></div>`+
    `<div class="kv"><span class="k">Moon</span><span class="v">${RASHI[Math.floor(B.Moon.disp/30)][0]} · ${NAK[nak]} pada ${pada}</span></div>`+
    `<div class="kv"><span class="k">Sun</span><span class="v">${RASHI[Math.floor(B.Sun.disp/30)][0]} ${(B.Sun.disp%30).toFixed(1)}°</span></div>`+
    `<div class="kv"><span class="k">Moon phase</span><span class="v">${ph.name} · ${(ph.illum*100).toFixed(0)}%</span></div>`+
    `<div class="kv"><span class="k">Retrograde ℞</span><span class="v">${retros.join(" ")||"none"}</span></div>`+
    `<div class="kv"><span class="k">Above horizon</span><span class="v">${visible.join(" ")||"none"}</span></div>`+
    `<div class="kv"><span class="k">Tithi</span><span class="v">${pc.tithi}</span></div>`;

  /* yogas + da\u015b\u0101 + telescope */
  const yEl=document.getElementById("yogaRead");
  if(yEl){const ch=buildChart(d,y,lat,lon);
    yEl.innerHTML=computeYogas(ch).map(g=>`<div class="kv"><span class="k">${g.name} <span style="opacity:.55">${g.kind}</span></span><span class="v">${g.note}</span></div>`).join("")||`<div class="empty">none</div>`;}
  const dEl=document.getElementById("dashaRead");
  if(dEl){const moonSid=rev(rawG.Moon-ayan(y));const vim=vimshottari(moonSid,y);
    dEl.innerHTML=`<div class="kv"><span class="k">Moon nak\u1e63atra</span><span class="v">${NAK[vim.nak]} \u2192 ${vim.startLord} mah\u0101da\u015b\u0101 (balance ${vim.balance.toFixed(1)}y)</span></div>`+
      vim.seq.map((s,i2)=>`<div class="kv"${i2===0?' style="border-left:2px solid var(--cy);padding-left:6px"':''}><span class="k">${GRAHA_GLYPH[s.lord]||""} ${s.lord} \u00b7 ${s.years}y</span><span class="v">${s.start.toFixed(1)} \u2192 ${s.end.toFixed(1)}</span></div>`).join("")+
      `<div class="empty" style="margin-top:4px">this moment read as janma-ku\u1e47\u1e0dal\u012b \u2014 cultural computation, not prediction</div>`;}
  const tEl=document.getElementById("telescopeRead");
  if(tEl){const eph=ephemerisTable(d,lat,lon);
    tEl.innerHTML=Object.keys(eph).map(nm=>{const bb=eph[nm];return `<div class="kv"><span class="k" style="color:${GRAHA_COL[nm]||"inherit"}">${GRAHA_GLYPH[nm]||""} ${nm}</span><span class="v">RA ${bb.raH.toFixed(2)}\u02b0 \u00b7 Dec ${bb.dec>=0?"+":""}${bb.dec.toFixed(1)}\u00b0 \u00b7 Alt ${bb.alt.toFixed(1)}\u00b0 \u00b7 Az ${bb.az.toFixed(1)}\u00b0${bb.alt>0?"":" \u00b7 below horizon"}</span></div>`;}).join("")+
    `<div class="empty" style="margin-top:4px">RA/Dec \u2192 equatorial GoTo \u00b7 Alt/Az \u2192 alt-az mounts \u00b7 ?api=telescope for JSON</div>`;}
}

/* ---- rāśi-chart shared hit map, North-Indian renderer, drag→house solver ---- */
const rasiHit={cells:[],glyphs:[],style:"south"};
const NORTH_POLYS=(function(){var s=10,e=390,m=200;
  var TL=[s,s],TR=[e,s],BR=[e,e],BL=[s,e],TM=[m,s],RM=[e,m],BM=[m,e],LM=[s,m],Cc=[m,m];
  var TLq=[(s+m)/2,(s+m)/2],TRq=[(e+m)/2,(s+m)/2],BRq=[(e+m)/2,(e+m)/2],BLq=[(s+m)/2,(e+m)/2];
  return [[TM,TRq,Cc,TLq],[TL,TM,TLq],[TL,TLq,LM],[LM,TLq,Cc,BLq],[BL,LM,BLq],[BL,BLq,BM],
          [BM,BLq,Cc,BRq],[BR,BM,BRq],[BR,BRq,RM],[RM,BRq,Cc,TRq],[TR,RM,TRq],[TR,TRq,TM]];})();
function polyCentroid(p){var x=0,y=0;p.forEach(function(q){x+=q[0];y+=q[1];});return [x/p.length,y/p.length];}
function pointInPoly(x,y,p){var inside=false;for(var i=0,j=p.length-1;i<p.length;j=i++){var xi=p[i][0],yi=p[i][1],xj=p[j][0],yj=p[j][1];
  if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}return inside;}
function renderNorth(svg,inSign,ascSign,B){
  svg.appendChild(E("rect",{x:10,y:10,width:380,height:380,fill:"rgba(5,9,18,.4)",stroke:"rgba(90,110,150,.35)"}));
  [[10,10,390,390],[390,10,10,390],[200,10,390,200],[390,200,200,390],[200,390,10,200],[10,200,200,10]]
    .forEach(function(l){svg.appendChild(E("line",{x1:l[0],y1:l[1],x2:l[2],y2:l[3],stroke:"rgba(90,110,150,.35)"}));});
  NORTH_POLYS.forEach(function(poly,h){var sign=(ascSign+h)%12;var ct=polyCentroid(poly);
    rasiHit.cells.push({sign:sign,poly:poly});
    if(h===0)svg.appendChild(E("path",{d:"M "+poly.map(function(p){return p.join(" ");}).join(" L ")+" Z",fill:"rgba(70,199,214,.07)"}));
    var list=inSign[sign];
    svg.appendChild(T(ct[0],ct[1]-(list.length?14:0),String(sign+1),{fill:"var(--mag)","font-size":11,"text-anchor":"middle","font-family":"var(--mono)","opacity":.75}));
    if(h===0)svg.appendChild(T(ct[0],ct[1]-27,"La",{fill:"var(--cy2)","font-size":9,"text-anchor":"middle","font-family":"var(--mono)"}));
    var per=3;
    list.forEach(function(nm,k){var row=Math.floor(k/per),colN=Math.min(list.length-row*per,per);
      var gx=ct[0]-((colN-1)*9)+(k%per)*18, gy=ct[1]+6+row*15;
      rasiHit.glyphs.push({nm:nm,x:gx,y:gy-4});
      svg.appendChild(T(gx-5,gy,GRAHA_GLYPH[nm],{fill:GRAHA_COL[nm],"font-size":13,"font-family":"var(--mono)","opacity":B[nm].alt>0?1:0.45}));
      if(B[nm].retro)svg.appendChild(T(gx+4,gy-6,"℞",{fill:"var(--mars)","font-size":8,"font-family":"var(--mono)"}));});
  });
}
function setupRasiDrag(){
  const svg=document.getElementById("rasi");if(!svg)return;
  let dr=null,ghost=null;
  const pt=ev=>{const r=svg.getBoundingClientRect();return [(ev.clientX-r.left)*400/r.width,(ev.clientY-r.top)*400/r.height];};
  svg.addEventListener("pointerdown",ev=>{
    const q=pt(ev),x=q[0],y=q[1];let best=null,bd=18;
    for(const g of rasiHit.glyphs){const d2=Math.hypot(g.x-x,g.y-y);if(d2<bd){bd=d2;best=g;}}
    if(!best)return;
    if(state.varga!==1){const vn=document.getElementById("vgname");
      if(vn){const o=vn.textContent;vn.textContent="switch to D1 to drag grahas";setTimeout(()=>{vn.textContent=o;},1600);}return;}
    dr={nm:best.nm};try{svg.setPointerCapture(ev.pointerId);}catch(e){}
    ghost=E("circle",{cx:x,cy:y,r:11,fill:"none",stroke:GRAHA_COL[best.nm],"stroke-width":1.5,"stroke-dasharray":"3 3"});
    svg.appendChild(ghost);ev.preventDefault();});
  svg.addEventListener("pointermove",ev=>{if(!dr||!ghost)return;const q=pt(ev);ghost.setAttribute("cx",q[0]);ghost.setAttribute("cy",q[1]);ev.preventDefault();});
  const up=ev=>{if(!dr)return;const q=pt(ev),x=q[0],y=q[1];const nm=dr.nm;dr=null;
    if(ghost&&ghost.parentNode)ghost.parentNode.removeChild(ghost);ghost=null;
    let tgt=null;
    for(const cell of rasiHit.cells){
      if(cell.poly?pointInPoly(x,y,cell.poly):(x>=cell.x&&x<=cell.x+cell.w&&y>=cell.y&&y<=cell.y+cell.h)){tgt=cell.sign;break;}}
    if(tgt==null)return;
    const y2=refYear();const trop=rev(tgt*30+15+CK.ayan(y2));
    setMomentFromDayNo(solveWhenLon(nm,trop,refDayNo()));refreshMoment();};
  svg.addEventListener("pointerup",up);
  svg.addEventListener("pointercancel",()=>{dr=null;if(ghost&&ghost.parentNode)ghost.parentNode.removeChild(ghost);ghost=null;});
}

/* ---------------- OPTIMISER + TILING ---------------- */
let lastOpt=[];
function optimise(){
  const evT=state.events.map(e=>e.t); const harm=state.waveform==="rectified"?2:1;
  if(evT.length<2)return [];
  const span=Math.max(...evT)-Math.min(...evT);
  const cand=new Map();
  CYCLES.forEach(c=>cand.set(c.P,{P:c.P,named:c}));
  for(let p=3;p<=Math.min(150,Math.max(30,span*1.3));p++)if(!cand.has(p))cand.set(p,{P:p,named:null});
  computeSpectrum().peaks.forEach(pk=>{if(![...cand.keys()].some(P=>Math.abs(P-pk.P)/pk.P<0.03))cand.set(pk.P,{P:pk.P,named:null});});
  const rows=[];for(const {P,named} of cand.values()){const {R,phase}=rayleigh(evT,P,harm);const peakYear=rev0(P*(phase/(TAU*harm)));rows.push({P,R,named,peakYear});}
  rows.sort((a,b)=>b.R-a.R);const kept=[];for(const r of rows){if(kept.some(k=>Math.abs(k.P-r.P)/r.P<0.05))continue;kept.push(r);if(kept.length>=10)break;}
  return kept;
}
function rev0(x){return x;}
function renderOpt(){
  lastOpt=optimise();const box=document.getElementById("optResults");box.innerHTML="";
  if(!lastOpt.length){document.getElementById("optHead").textContent="Need at least two events.";buildPrompt();return;}
  const top=lastOpt[0];
  document.getElementById("optHead").innerHTML=`Tightest fit under the <b>${state.waveform}</b> waveform: <span class="em">${top.P.toFixed(2)}y</span> — phase-coherence r=<span class="em">${top.R.toFixed(3)}</span>${top.named?` ≈ ${top.named.g} ${top.named.nm}`:``}. ${top.R>0.8?"Strong lock.":top.R>0.55?"Moderate.":"Weak — likely no single period."}`;
  lastOpt.forEach(r=>{const row=document.createElement("div");row.className="resrow";
    row.innerHTML=`<span class="g" style="color:${r.named?r.named.c:'var(--faint)'}">${r.named?r.named.g:'·'}</span><span class="nm">${r.named?r.named.nm:r.P.toFixed(2)+"-yr cycle"}</span><span class="val">r ${r.R.toFixed(3)}</span><span class="p2">${r.P.toFixed(2)}y</span>`;
    row.onclick=()=>{if(r.named){state.on.add(r.named.k);}state.view="orrery";syncTabs();renderAll();};
    box.appendChild(row);});
  buildPrompt();
}
function renderTile(){
  const ys=[...new Set(state.events.map(e=>Math.round(e.t)))].sort((a,b)=>a-b);const box=document.getElementById("optResults");
  if(ys.length<2){box.innerHTML=`<div class="empty">Need ≥2 events.</div>`;return;}
  const al=[3,6,9,12];const gaps=[];for(let i=1;i<ys.length;i++)gaps.push(ys[i]-ys[i-1]);
  const pg=gaps.map(g=>comps(g,al,300));if(pg.some(c=>!c.length)){box.innerHTML=`<div class="empty">Gaps ${gaps.join(", ")} can't all be tiled by {3,6,9,12}.</div>`;document.getElementById("optHead").textContent="No exact tiling with {3,6,9,12}.";return;}
  let acc=[[]];const CAP=2000;let trunc=false;for(const cs of pg){const nx=[];for(const a of acc){for(const c of cs){nx.push(a.concat(c));if(nx.length>=CAP){trunc=true;break;}}if(nx.length>=CAP)break;}acc=nx;if(acc.length>=CAP)break;}
  document.getElementById("optHead").innerHTML=`<span class="em">${acc.length}${trunc?"+":""}</span> exact interval-tilings over {3,6,9,12} hit every event (epoch ${ys[0]}). Palindromes first.`;
  const isPal=p=>{for(let i=0,j=p.length-1;i<j;i++,j--)if(p[i]!==p[j])return false;return true;};
  const sorted=acc.map(p=>({p,pal:isPal(p)})).sort((a,b)=>(b.pal-a.pal)||a.p.length-b.p.length);
  box.innerHTML="";sorted.slice(0,60).forEach(({p,pal})=>{const row=document.createElement("div");row.className="resrow";
    row.innerHTML=`<span class="nm">${p.join(" · ")}</span>`+(pal?`<span class="val">◇ mirror</span>`:``)+`<span class="p2">${p.reduce((a,b)=>a+b,0)}y</span>`;box.appendChild(row);});
}

/* ---------------- AI HAND-OFF ---------------- */
function buildPrompt(){
  const ev=state.events.map(e=>e.date?e.date.toISOString().slice(0,10)+(e.label?" "+e.label:""):Math.round(e.t)+(e.label?" "+e.label:"")).join("; ");
  const opt=(lastOpt.length?lastOpt:optimise()).slice(0,5);
  const periods=opt.map(r=>`${r.P.toFixed(1)}y (coherence ${r.R.toFixed(2)}${r.named?", ≈"+r.named.nm:""})`).join("; ");
  let lag="";
  try{const {pos}=chartPositions();const nak=Math.floor(pos.Moon/(360/27));lag=` The reference moment ${state.refDate} ${state.refTime} at lat ${state.lat}/lon ${state.lon} gives Lagna ${RASHI[Math.floor(pos.Asc/30)][0]}, Moon in ${RASHI[Math.floor(pos.Moon/30)][0]} (${NAK[nak]} nakshatra), Sun in ${RASHI[Math.floor(pos.Sun/30)][0]} (${state.zodiac}).`;}catch(e){}
  const p=`I am analysing a set of dated events for periodic / cyclic structure and would like your help.\n\nEVENTS: ${ev}.\n\nA Rayleigh phase-coherence analysis over these irregular event times finds these dominant periods: ${periods}.${lag}\n\nPlease: (1) web-search for real historical, astronomical, geophysical, economic, or astrological cycles that match these periods and the specific dates; (2) assess whether the periodicity is statistically meaningful or likely coincidental given the small sample; (3) name the most plausible cycle(s) that could generate a ~${opt[0]?opt[0].P.toFixed(0):"?"}-year spacing and explain the mechanism; (4) cite your sources. Be rigorous and note uncertainty.`;
  document.getElementById("aiPrompt").value=p;
  return p;
}
function openAI(base){const q=encodeURIComponent(buildPrompt());window.open(base+q,"_blank","noopener");}

/* ---------------- retrograde, moon, panchanga, visibility, eclipses ---------------- */


/* ---------------- multi-tradition calendars (verified) ---------------- */

/* ---------------- moon phase icon ---------------- */
function moonIcon(svg,cx,cy,r,ill,wax){
  svg.appendChild(E("circle",{cx,cy,r,fill:"#0a0e1a",stroke:"rgba(90,110,150,.4)"}));
  const xr=r*Math.cos(Math.PI*ill);const s1=wax?1:0;const s2=xr>=0?(wax?0:1):(wax?1:0);
  svg.appendChild(E("path",{d:`M ${cx} ${cy-r} A ${r} ${r} 0 0 ${s1} ${cx} ${cy+r} A ${Math.abs(xr).toFixed(2)} ${r} 0 0 ${s2} ${cx} ${cy-r} Z`,fill:"var(--moon)"}));
  svg.appendChild(E("circle",{cx,cy,r,fill:"none",stroke:"rgba(90,110,150,.4)"}));
}

/* ---------------- ALMANAC ---------------- */
var _festY=null,_festList=[];
function renderAlmanac(){
  const d=refDayNo(),y=refYear(),Y=parseInt(state.refDate)||2000;const jdn=Math.floor(d+2451543.5+0.5);
  const ph=phaseInfo(d),pc=panchanga(d,y);
  // moon
  const ms=clr("moonSvg");moonIcon(ms,70,70,52,ph.illum,ph.waxing);
  document.getElementById("moonRead").innerHTML=
    `<div class="kv"><span class="k">Phase</span><span class="v">${ph.name} · ${(ph.illum*100).toFixed(0)}% lit</span></div>`+
    `<div class="kv"><span class="k">Elongation</span><span class="v">${ph.elong.toFixed(1)}° ${ph.waxing?"waxing":"waning"}</span></div>`+
    `<div class="kv"><span class="k">Tithi</span><span class="v">${pc.tithi}</span></div>`+
    `<div class="kv"><span class="k">Moon latitude</span><span class="v">${pc.moonLat>=0?"+":""}${pc.moonLat.toFixed(2)}° ${Math.abs(pc.moonLat)<1.5?"— near node (eclipse zone)":""}</span></div>`;
  // panchanga
  document.getElementById("panchangaRead").innerHTML=
    `<div class="kv"><span class="k">Vāra (weekday)</span><span class="v">${pc.vara}</span></div>`+
    `<div class="kv"><span class="k">Nakṣatra</span><span class="v">${pc.nak}</span></div>`+
    `<div class="kv"><span class="k">Yoga</span><span class="v">${pc.yoga}</span></div>`+
    `<div class="kv"><span class="k">Karaṇa</span><span class="v">${pc.karana}</span></div>`+
    `<div class="kv"><span class="k">Manzil (Sufi, 28)</span><span class="v">${pc.manzil}</span></div>`;
  // eclipses ±18 months — rows are inputs: click to jump
  const ecl=eclipses(d-560,d+560);const eb=document.getElementById("eclipseRead");
  eb.innerHTML="";
  if(!ecl.length)eb.innerHTML=`<div class="empty">No eclipses within ±18 months.</div>`;
  else ecl.forEach(e=>{const row=document.createElement("div");row.className="kv";row.style.cursor="pointer";
    row.innerHTML=`<span class="k">${e.type==="solar"?"☀ Solar":"☾ Lunar"} eclipse</span><span class="v">${d2date(e.d)} · Sun–node ${e.dist.toFixed(1)}° ${e.central?"(central/total possible)":"(partial)"}</span>`;
    row.onclick=()=>{setMomentFromDayNo(e.d);refreshMoment();};
    eb.appendChild(row);});
  // calendars
  const [hy,hm,hd]=greg2hijri(jdn);const my=mayan(jdn);
  const sv=samvInfo(d,Y),sh=solarHijri(d,Y);
  document.getElementById("calRead").innerHTML=
    `<div class="kv"><span class="k">Julian Day</span><span class="v">${(d+2451543.5).toFixed(2)}</span></div>`+
    `<div class="kv"><span class="k">Gregorian</span><span class="v">${state.refDate}</span></div>`+
    `<div class="kv"><span class="k">Islamic — lunar Hijrī (tabular)</span><span class="v">${hd} ${HIJRI_M[hm-1]||hm} ${hy} AH</span></div>`+
    `<div class="kv"><span class="k">Islamic — Solar Hijrī (Nowruz)</span><span class="v">${sh.d} ${sh.m} ${sh.y} SH</span></div>`+
    `<div class="kv"><span class="k">Islamic \u2014 Sunni tabular</span><span class="v">${(q=>q.d+" "+(HIJRI_M[q.m-1]||q.m)+" "+q.y+" AH")(hijriSunni(jdn))}</span></div>`+
    `<div class="kv"><span class="k">Islamic \u2014 Shia (Ithn\u0101-\u02bfAshar\u012b) tabular</span><span class="v">${(q=>q.d+" "+(HIJRI_M[q.m-1]||q.m)+" "+q.y+" AH")(hijriShia(jdn))}</span></div>`+
    `<div class="kv"><span class="k">Jewish (Hebrew, civil day)</span><span class="v">${(h=>h.d+" "+h.month+" "+h.y+" AM")(hebrew(jdn))}</span></div>`+
    `<div class="kv"><span class="k">Sikh Nanakshahi</span><span class="v">${(n=>n.d+" "+n.month+" "+n.y+" NS")(nanakshahi(jdn))}</span></div>`+
    `<div class="kv"><span class="k">Vedic saṁvatsara (sauramāna)</span><span class="v">${sv.name} · Śaka ${sv.saka} · Vikrama ${sv.vikrama} · Kali ${sv.y+3101}</span></div>`+
    `<div class="kv"><span class="k">Chinese (sexagenary)</span><span class="v">${chineseYear(Y)}</span></div>`+
    `<div class="kv"><span class="k">Tibetan (Buddhist)</span><span class="v">${tibetYear(Y)}</span></div>`+
    `<div class="kv"><span class="k">Mayan Long Count</span><span class="v">${my.lc} · ${my.tz} · Haab ${my.haab}</span></div>`+
    `<div class="kv"><span class="k">Western (precessional age)</span><span class="v">Age of ${astroAge(y)}</span></div>`;
  const fb=document.getElementById("festRead");
  if(fb){const yr=parseInt(state.refDate)||Y;
    if(_festY!==yr){_festList=annualEvents(yr);_festY=yr;}
    const fy=document.getElementById("festYear");if(fy)fy.textContent=yr;
    fb.innerHTML="";
    _festList.forEach(ev=>{const row=document.createElement("div");row.className="kv";row.style.cursor="pointer";
      const cur=ev.date===state.refDate;
      row.innerHTML=`<span class="k">${ev.date}${cur?" \u25c0":""}</span><span class="v"><b>${ev.name}</b> \u00b7 ${ev.tradition}${ev.note?` <span style="opacity:.6">(${ev.note})</span>`:""}</span>`;
      if(cur)row.style.outline="1px solid var(--cy)";
      row.onclick=()=>{state.refDate=ev.date;const el=document.getElementById("refDate");if(el)el.value=ev.date;refreshMoment();};
      fb.appendChild(row);});}
  renderEclGeo();
}
/* ================= EVERY GRAPH IS AN INPUT — new engines ================= */
/* ---- horizon: alt+az (extends altOf) ---- */

/* ---- inverse solvers: grab the output, solve the input ---- */

/* ---- solar new-years from the same kernel ---- */

/* ---- moment cards: everything on the main page ---- */
let __mcKey="";
function renderMomCards(){
  const box=document.getElementById("momCards");if(!box)return;
  const key=state.refDate+"|"+state.refTime+"|"+state.lat+"|"+state.lon+"|"+state.zodiac;
  if(key===__mcKey&&box.firstChild)return; __mcKey=key;
  const d=refDayNo(),y=refYear(),Y=parseInt(state.refDate)||2000,jdn=Math.floor(d+2451543.5+0.5);
  const ph=phaseInfo(d),pc=panchanga(d,y);
  const ascD=siderealAdj(ascendant(d,state.lat,state.lon),y);
  const moonD=siderealAdj(moonLon(d),y);
  const sv=samvInfo(d,Y),sh=solarHijri(d,Y);const hj=greg2hijri(jdn);
  const retros=["Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune"].filter(n=>retro(n,d)).map(n=>GRAHA_GLYPH[n]);
  const ec=eclipses(d,d+560)[0];
  const sunA=altAz(sunLon(d).lon,0,d,state.lat,state.lon).alt;
  const dayState=sunA>0?"day ☀":sunA>-6?"civil twilight":sunA>-12?"nautical twilight":sunA>-18?"astronomical twilight":"night ✦";
  const cards=[
    ["moon","almanac",`<span class="big">${["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"][Math.floor(rev(ph.elong+22.5)/45)%8]}</span><b>${ph.name}</b> · ${(ph.illum*100).toFixed(0)}%<br>${pc.tithi}`],
    ["lagna · moon","lagna",`Lagna <b>${RASHI[Math.floor(ascD/30)][0]}</b> ${(ascD%30).toFixed(1)}°<br>☾ ${RASHI[Math.floor(moonD/30)][0]} · ${pc.nak}`],
    ["saṁvatsara","almanac",`<b>${sv.name}</b><br>Śaka ${sv.saka} · Vikrama ${sv.vikrama} · Kali ${sv.y+3101}`],
    ["hijrī — lunar &amp; solar","almanac",`${hj[2]} ${HIJRI_M[hj[1]-1]||hj[1]} <b>${hj[0]} AH</b><br>${sh.d} ${sh.m} <b>${sh.y} SH</b>`],
    ["retrograde ℞","lagna",retros.length?`<b>${retros.join(" ")}</b> retrograde`:`all direct`],
    ["next eclipse","almanac",ec?`<b>${ec.type==="solar"?"☀ solar":"☾ lunar"}</b> · ${d2date(ec.d)}<br>Sun–node ${ec.dist.toFixed(1)}°`:`none in 18 mo`],
    ["sky now","sky",`<b>${dayState}</b><br>Sun alt ${sunA.toFixed(0)}° · ${pc.vara}`],
  ];
  box.innerHTML="";
  cards.forEach(([k,view,html])=>{const c=document.createElement("div");c.className="mcard";
    c.innerHTML=`<div class="mk">${k}</div><div class="mv">${html}</div>`;
    c.onclick=()=>{state.view=view;syncTabs();renderView();};box.appendChild(c);});
}

/* ---- generic time-drag: waveform/timeline panels scrub the epoch ---- */
function makeEpochDrag(id,yearsPerPx){
  const svg=document.getElementById(id);if(!svg)return;
  let dr=null;
  svg.addEventListener("pointerdown",ev=>{dr={x:ev.clientX,e0:state.anchor,raf:0};try{svg.setPointerCapture(ev.pointerId);}catch(e){}svg.style.cursor="grabbing";ev.preventDefault();});
  svg.addEventListener("pointermove",ev=>{if(!dr)return;
    const r=svg.getBoundingClientRect();const vw=(svg.viewBox&&svg.viewBox.baseVal&&svg.viewBox.baseVal.width)||1160;
    const ypp=yearsPerPx()*(vw/r.width);
    state.anchor=dr.e0+(ev.clientX-dr.x)*ypp;reflectEpoch();
    if(!dr.raf)dr.raf=requestAnimationFrame(()=>{(state.view==="orrery")?renderInstrument():renderView();if(dr)dr.raf=0;});
    ev.preventDefault();});
  const end=()=>{if(dr){dr=null;svg.style.cursor="grab";(state.view==="orrery")?renderInstrument():renderView();}};
  svg.addEventListener("pointerup",end);svg.addEventListener("pointercancel",end);
}

/* ---- sky view: dome + AR ---- */
const skyS={mode:"dome",fov:70,az:180,alt:30,roll:0,azOff:0,sensor:false,raf:0};
function starsNow(y){const pr=0.0139552*(y-2000);
  return STARS.map(s=>{let lam=s[0],bet=s[1];
    if(s[5]){const e=23.4393,ra=s[0],dec=s[1];
      lam=CK.atan2d(CK.S(ra)*CK.C(e)+CK.Tn(dec)*CK.S(e),CK.C(ra));
      bet=Math.asin(Math.max(-1,Math.min(1,CK.S(dec)*CK.C(e)-CK.C(dec)*CK.S(e)*CK.S(ra))))*CK.R2D;}
    return {lam:rev(lam+pr),bet:bet,mag:s[2],nm:s[3],yg:s[4]};});}

const CONST_FIGS=[
 {nm:"Orion",l:[["Betelgeuse","Alnitak","Alnilam","Mintaka","Bellatrix","Betelgeuse"],["Mintaka","Rigel"],["Alnitak","Saiph"],["Betelgeuse","Meissa","Bellatrix"]]},
 {nm:"Ursa Major",l:[["Dubhe","Merak","Phecda","Megrez","Dubhe"],["Megrez","Alioth","Mizar","Alkaid"]]},
 {nm:"Cassiopeia",l:[["Caph","Schedar","γ Cas","Ruchbah","Segin"]]},
 {nm:"Scorpius",l:[["Dschubba","Antares","ε Sco","Sargas","Shaula"]]},
 {nm:"Crux",l:[["Acrux","Gacrux"],["Mimosa","δ Cru"]]},
 {nm:"Cygnus",l:[["Deneb","Sadr","Albireo"]]},
 {nm:"Gemini",l:[["Castor","Pollux","Alhena"]]},
 {nm:"Leo",l:[["Regulus","Algieba","Zosma","Denebola"]]},
 {nm:"Taurus",l:[["Aldebaran","Alcyone"]]}];
function skyBodies(d){
  const g=grahas(d);
  const P=[["Sun","☉","var(--sun)"],["Moon","☾","var(--moon)"],["Mercury","☿","var(--merc)"],["Venus","♀","var(--ven)"],["Mars","♂","var(--mars)"],["Jupiter","♃","var(--jup)"],["Saturn","♄","var(--sat)"],["Rahu","☊","var(--rahu)"],["Ketu","☋","var(--rahu)"],["Uranus","♅","var(--ura)"],["Neptune","♆","var(--nep)"]];
  return P.map(([nm,gl,col])=>({nm,gl,col,lonT:g[nm],beta:nm==="Moon"?moonLatf(d):0}));}
function domeXY(az,alt,cx,cy,R){const r=R*(90-alt)/90;const a=az*D2R;return[cx-r*Math.sin(a),cy-r*Math.cos(a)];} /* N top, E left — looking up */
function camBasis(az,alt,roll){
  const f=[S(az)*C(alt),C(az)*C(alt),S(alt)];
  const u0=[-S(az)*S(alt),-C(az)*S(alt),C(alt)];
  const r0=[f[1]*u0[2]-f[2]*u0[1],f[2]*u0[0]-f[0]*u0[2],f[0]*u0[1]-f[1]*u0[0]];
  const cr=C(roll),sr=S(roll);
  return {f,u:[u0[0]*cr+r0[0]*sr,u0[1]*cr+r0[1]*sr,u0[2]*cr+r0[2]*sr],
          r:[r0[0]*cr-u0[0]*sr,r0[1]*cr-u0[1]*sr,r0[2]*cr-u0[2]*sr]};}
function dayStateShort(a){return a>0?"day":a>-6?"civil":a>-12?"nautical":a>-18?"astro":"night";}
function renderSky(){
  const svg=clr("skyview");const W=700,cx=350,cy=350,R=330;
  const d=refDayNo(),y=refYear(),lat=state.lat,lon=state.lon;
  const sunA=altAz(sunLon(d).lon,0,d,lat,lon).alt;
  const bg=sunA>0?"skyD":sunA>-6?"skyC":sunA>-12?"skyU":sunA>-18?"skyA":"skyN";
  const dome=skyS.mode==="dome";
  svg.appendChild(E("circle",{cx,cy,r:dome?R:W,class:bg}));
  const proj=(()=>{ if(dome) return (az,alt)=>alt<-1?null:domeXY(az,alt,cx,cy,R);
    const B=camBasis(rev(skyS.az+skyS.azOff),skyS.alt,skyS.roll);const fl=(W/2)/Math.tan(skyS.fov/2*D2R);
    return (az,alt)=>{const v=[S(az)*C(alt),C(az)*C(alt),S(alt)];
      const zc=v[0]*B.f[0]+v[1]*B.f[1]+v[2]*B.f[2];if(zc<0.02)return null;
      const xc=v[0]*B.r[0]+v[1]*B.r[1]+v[2]*B.r[2],yc=v[0]*B.u[0]+v[1]*B.u[1]+v[2]*B.u[2];
      return [cx+xc/zc*fl,cy-yc/zc*fl];};})();
  const path=(gen,st)=>{let pp="",pen=false;
    for(const [q0,q1] of gen){const p=proj(q0,q1);
      if(!p){pen=false;continue;}
      pp+=(pen?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)+" ";pen=true;}
    if(pp)svg.appendChild(E("path",Object.assign({d:pp,fill:"none"},st)));};
  for(const altc of [0,30,60]){const g=[];for(let a=0;a<=360;a+=3)g.push([a,altc]);
    path(g,{stroke:altc===0?"rgba(200,120,80,.55)":"rgba(90,110,150,.22)","stroke-width":altc===0?1.6:1});}
  for(let a=0;a<360;a+=30){const g=[];for(let al=0;al<=88;al+=4)g.push([a,al]);
    path(g,{stroke:"rgba(90,110,150,.12)"});}
  [["N",0],["E",90],["S",180],["W",270]].forEach(([L,a])=>{const p=proj(a,2);if(p)svg.appendChild(T(p[0],p[1],L,{fill:"var(--amber)","font-size":14,"text-anchor":"middle","font-family":"var(--mono)"}));});
  {const g=[];for(let l=0;l<=360;l+=3){const h=altAz(l,0,d,lat,lon);g.push([h.az,h.alt]);}
   path(g,{stroke:"rgba(70,199,214,.35)","stroke-dasharray":"5 4","stroke-width":1.3});}
  const yc=document.getElementById("yogChk");const showYg=!yc||yc.checked!==false;
  const _stars=starsNow(y),_sp={};
  for(const s of _stars){const h=altAz(s.lam,s.bet,d,lat,lon);_sp[s.nm]=proj(h.az,h.alt);}
  {const _cc=document.getElementById("constChk");
   if(!_cc||_cc.checked!==false){
    for(const fig of CONST_FIGS){let sx=0,sy=0,sn=0;
      for(const line of fig.l){let pp="",pen=false;
        for(const nmm of line){const p2=_sp[nmm];
          if(!p2){pen=false;continue;}
          pp+=(pen?"L":"M")+p2[0].toFixed(1)+" "+p2[1].toFixed(1)+" ";pen=true;sx+=p2[0];sy+=p2[1];sn++;}
        if(pp)svg.appendChild(E("path",{d:pp,fill:"none",stroke:"rgba(140,165,215,.30)","stroke-width":0.9}));}
      if(sn>=3)svg.appendChild(T(sx/sn,sy/sn,fig.nm,{fill:"rgba(140,165,215,.5)","font-size":9,"text-anchor":"middle","font-family":"var(--mono)"}));
    }}}
  for(const s of _stars){const p=_sp[s.nm];if(!p)continue;
    const r=Math.max(0.9,3.4-0.62*s.mag);
    svg.appendChild(E("circle",{cx:p[0],cy:p[1],r,fill:"#e8ecff","fill-opacity":Math.max(.35,1-0.13*s.mag)}));
    const lbl=s.yg&&showYg? s.nm+" · "+s.yg : (s.mag<1.7? s.nm : null);
    if(lbl)svg.appendChild(T(p[0]+r+2,p[1]+3,lbl,{fill:s.yg?"var(--mag)":"var(--dim)","font-size":8.5,"font-family":"var(--mono)","fill-opacity":.85}));}
    window.__skyB=[];
  for(const b of skyBodies(d)){const h=altAz(b.lonT,b.beta,d,lat,lon);const p=proj(h.az,h.alt);if(!p)continue;
    window.__skyB.push({nm:b.nm,x:p[0],y:p[1]});
    if(b.nm==="Moon"){const ph=phaseInfo(d);moonIcon(svg,p[0],p[1],9,ph.illum,ph.waxing);}
    else if(b.nm==="Sun"){svg.appendChild(E("circle",{cx:p[0],cy:p[1],r:9,fill:"var(--sun)",style:"filter:drop-shadow(0 0 8px var(--sun))"}));}
    else svg.appendChild(T(p[0],p[1]+5,b.gl,{fill:b.col,"font-size":16,"text-anchor":"middle","font-family":"var(--mono)",style:`filter:drop-shadow(0 0 4px ${b.col})`}));
    svg.appendChild(T(p[0],p[1]+18,b.nm,{fill:b.col,"font-size":8.5,"text-anchor":"middle","font-family":"var(--mono)","fill-opacity":.8}));}
  if(dome)svg.appendChild(E("circle",{cx,cy,r:R,fill:"none",stroke:"rgba(90,110,150,.5)","stroke-width":1.5}));
  const st=document.getElementById("sensorStat");
  if(st)st.textContent=(dome?"dome":"AR "+skyS.fov+"°")+" · "+(skyS.sensor?"sensors live — drag ⇄ to trim azimuth":"drag to look · drag a body to time-travel")+" · "+dayStateShort(sunA)+(dome?"":" · Esc exits");
  {const xb2=document.getElementById("arExit");if(xb2)xb2.style.display=(dome&&!skyS.sensor)?"none":"";}
}
function skyInv(x,y){
  const cx=350,cy=350,R=330;
  if(skyS.mode==="dome"){const dx=cx-x,dy=cy-y,r=Math.hypot(dx,dy);if(r>R+6)return null;
    return {az:rev(atan2d(dx,dy)),alt:90-90*Math.min(r,R)/R};}
  const B=camBasis(rev(skyS.az+skyS.azOff),skyS.alt,skyS.roll),fl=350/Math.tan(skyS.fov/2*D2R);
  const xc=(x-cx)/fl,yc=(cy-y)/fl;
  const v=[B.f[0]+B.r[0]*xc+B.u[0]*yc,B.f[1]+B.r[1]*xc+B.u[1]*yc,B.f[2]+B.r[2]*xc+B.u[2]*yc];
  const m=Math.hypot(v[0],v[1],v[2]);
  return {az:rev(atan2d(v[0],v[1])),alt:Math.asin(v[2]/m)*R2D};}
function lonFromAzAlt(az,alt,d,lat,lonE){
  const sd=S(lat)*S(alt)+C(lat)*C(alt)*C(az);
  const dec=Math.asin(Math.max(-1,Math.min(1,sd)))*R2D;
  const ha=atan2d(-S(az)*C(alt),S(alt)*C(lat)-C(alt)*S(lat)*C(az));
  const ra=rev(gmst(d)+lonE-ha),e=obliq(d);
  return rev(atan2d(S(ra)*C(e)+Tn(dec)*S(e),C(ra)));}
const BODYWIN={Sun:380,Moon:32,Mercury:150,Venus:340,Mars:820,Jupiter:4500,Saturn:11200,Rahu:6900,Ketu:6900,Uranus:31500,Neptune:62000};
function solveWhenLon(nm,lam,d0){
  const w=(BODYWIN[nm]||400)/2,N=240;let bk=d0,bv=1e9;
  const f=t=>{let x=rev(grahas(t)[nm]-lam);return x>180?x-360:x;};
  for(let k=0;k<=N;k++){const t=d0-w+2*w*k/N,ab=Math.abs(f(t));if(ab<bv){bv=ab;bk=t;}}
  let lo=bk-2*w/N,hi=bk+2*w/N,flo=f(lo),fhi=f(hi);
  if(flo*fhi>0)return bk;
  for(let i=0;i<46;i++){const m=(lo+hi)/2,fm=f(m);if(flo*fm<=0){hi=m;fhi=fm;}else{lo=m;flo=fm;}}
  return (lo+hi)/2;}
function setupSky(){
  const svg=document.getElementById("skyview");if(!svg)return;
  let dr=null;
  svg.addEventListener("pointerdown",ev=>{
    {const rc=svg.getBoundingClientRect(),px=(ev.clientX-rc.left)*700/rc.width,py=(ev.clientY-rc.top)*700/rc.height;
     const hit=(window.__skyB||[]).map(bb=>({bb,d2:(bb.x-px)**2+(bb.y-py)**2})).sort((a,c)=>a.d2-c.d2)[0];
     if(hit&&hit.d2<19*19){dr={body:hit.bb.nm,raf:0,pend:null};try{svg.setPointerCapture(ev.pointerId);}catch(e){}ev.preventDefault();return;}}
    dr={x:ev.clientX,y:ev.clientY,az:skyS.az,alt:skyS.alt,off:skyS.azOff,raf:0};try{svg.setPointerCapture(ev.pointerId);}catch(e){}ev.preventDefault();});
  svg.addEventListener("pointermove",ev=>{if(!dr)return;
    if(dr.body){const rc=svg.getBoundingClientRect(),px=(ev.clientX-rc.left)*700/rc.width,py=(ev.clientY-rc.top)*700/rc.height;
      const q=skyInv(px,py);
      if(q&&q.alt>-25){dr.pend=lonFromAzAlt(q.az,q.alt,refDayNo(),state.lat,state.lon);
        if(!dr.raf)dr.raf=requestAnimationFrame(()=>{if(dr&&dr.pend!=null)setMomentFromDayNo(solveWhenLon(dr.body,dr.pend,refDayNo()));if(dr)dr.raf=0;});}
      ev.preventDefault();return;}
    const r=svg.getBoundingClientRect();const sc=skyS.fov/r.width;
    if(skyS.sensor){skyS.azOff=dr.off+(dr.x-ev.clientX)*sc;}
    else if(skyS.mode==="ar"){skyS.az=rev(dr.az+(dr.x-ev.clientX)*sc);skyS.alt=Math.max(-20,Math.min(89,dr.alt+(ev.clientY-dr.y)*sc));}
    if(!dr.raf)dr.raf=requestAnimationFrame(()=>{renderSky();if(dr)dr.raf=0;});ev.preventDefault();});
  const end=()=>{dr=null;};svg.addEventListener("pointerup",end);svg.addEventListener("pointercancel",end);
  document.querySelectorAll("#skyModeSeg button").forEach(b=>b.onclick=()=>{skyS.mode=b.dataset.m;document.querySelectorAll("#skyModeSeg button").forEach(x=>x.classList.toggle("on",x===b));renderSky();});
  const fs=document.getElementById("fovSlider");
  if(fs)fs.addEventListener("input",e=>{skyS.fov=+e.target.value;const L=document.getElementById("fovLbl");if(L)L.textContent=skyS.fov+"°";if(skyS.mode==="ar")renderSky();});
  const yc=document.getElementById("yogChk");if(yc)yc.onchange=()=>renderSky();
  const cc2=document.getElementById("constChk");if(cc2)cc2.onchange=()=>renderSky();
  const sb=document.getElementById("sensorBtn");
  if(sb)sb.onclick=async()=>{
    const stat=document.getElementById("sensorStat");
    try{
      if(typeof DeviceOrientationEvent!=="undefined"&&DeviceOrientationEvent.requestPermission){
        const p=await DeviceOrientationEvent.requestPermission();if(p!=="granted"){if(stat)stat.textContent="sensor permission denied";return;}}
      const handler=skyS._h=ev=>{if(ev.alpha==null)return;skyS.sensor=true;
        let alpha=ev.alpha;if(ev.webkitCompassHeading!=null)alpha=360-ev.webkitCompassHeading;
        const B=devBasis(alpha,ev.beta||0,ev.gamma||0);
        skyS.az=atan2d(B.fwd[0],B.fwd[1]);skyS.alt=Math.asin(Math.max(-1,Math.min(1,B.fwd[2])))*R2D;
        skyS.roll=atan2d(-B.right[2],B.up[2]);
        if(skyS.mode!=="ar"){skyS.mode="ar";document.querySelectorAll("#skyModeSeg button").forEach(x=>x.classList.toggle("on",x.dataset.m==="ar"));}
        if(!skyS.raf)skyS.raf=requestAnimationFrame(()=>{renderSky();skyS.raf=0;});};
      window.addEventListener("deviceorientationabsolute",handler,true);
      window.addEventListener("deviceorientation",handler,true);
      if(stat)stat.textContent="sensors: waiting… (needs HTTPS + a device with orientation sensors)";
      setTimeout(()=>{if(!skyS.sensor&&stat)stat.textContent="no sensor data — drag to look instead";},2500);
    }catch(e){if(stat)stat.textContent="sensors unavailable — drag to look";}
  };
  function exitAR(){
    skyS.sensor=false;skyS.mode="dome";skyS.roll=0;
    if(skyS._h){window.removeEventListener("deviceorientationabsolute",skyS._h,true);
      window.removeEventListener("deviceorientation",skyS._h,true);skyS._h=null;}
    if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
    document.querySelectorAll("#skyModeSeg button").forEach(x=>x.classList.toggle("on",x.dataset.m==="dome"));
    const st2=document.getElementById("sensorStat");if(st2)st2.textContent="dome view — press Esc anytime to leave AR";
    renderSky();
  }
  skyS.exitAR=exitAR;
  {const xb=document.getElementById("arExit");if(xb)xb.onclick=exitAR;}
  document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&(skyS.mode==="ar"||skyS.sensor))exitAR();});
}
function devBasis(al,be,ga){const ca=C(al),sa=S(al),cb=C(be),sb=S(be),cg=C(ga),sg=S(ga);
  const R=[[ca*cg-sa*sb*sg,-sa*cb,ca*sg+sa*sb*cg],[sa*cg+ca*sb*sg,ca*cb,sa*sg-ca*sb*cg],[-cb*sg,sb,cb*cg]];
  const m=v=>[R[0][0]*v[0]+R[0][1]*v[1]+R[0][2]*v[2],R[1][0]*v[0]+R[1][1]*v[1]+R[1][2]*v[2],R[2][0]*v[0]+R[2][1]*v[1]+R[2][2]*v[2]];
  return {fwd:m([0,0,-1]),up:m([0,1,0]),right:m([1,0,0])};}

/* ---- globe: pick lat/lon on real coastlines ---- */
const gl={lam0:78,phi0:20,drag:null,moved:0,raf:0};
function orthoXY(lat,lon,cx,cy,R){const dl=lon-gl.lam0;
  const x=C(lat)*S(dl), y=C(gl.phi0)*S(lat)-S(gl.phi0)*C(lat)*C(dl), z=S(gl.phi0)*S(lat)+C(gl.phi0)*C(lat)*C(dl);
  return z<0?null:[cx+R*x,cy-R*y];}
function renderGlobe(){
  const svg=clr("globe");if(!svg)return;const cx=150,cy=150,R=140;
  svg.appendChild(E("circle",{cx,cy,r:R,fill:"rgba(8,14,28,.9)",stroke:"rgba(70,199,214,.4)"}));
  const path=(pts,st)=>{let pp="",pen=false;
    for(const q of pts){const p=q&&orthoXY(q[0],q[1],cx,cy,R);
      if(!p){pen=false;continue;}pp+=(pen?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)+" ";pen=true;}
    if(pp)svg.appendChild(E("path",Object.assign({d:pp,fill:"none"},st)));};
  for(let la=-60;la<=60;la+=30){const g=[];for(let lo=0;lo<=360;lo+=6)g.push([la,lo]);path(g,{stroke:"rgba(90,110,150,.16)"});}
  for(let lo=0;lo<360;lo+=30){const g=[];for(let la=-88;la<=88;la+=4)g.push([la,lo]);path(g,{stroke:"rgba(90,110,150,.12)"});}
  /* continent coastlines (COAST: flattened [lon×10,lat×10] pairs) */
  for(const ring of COAST){const g=[];for(let i=0;i<ring.length;i+=2)g.push([ring[i+1]/10,ring[i]/10]);
    path(g,{stroke:"rgba(120,200,180,.35)","stroke-width":0.7});}
  /* reference circles: equator, tropics, polar circles */
  [[0,"rgba(70,199,214,.55)",1.4,""],[23.44,"rgba(230,180,80,.42)",1,"3 4"],[-23.44,"rgba(230,180,80,.42)",1,"3 4"],[66.56,"rgba(90,110,150,.3)",1,"2 5"],[-66.56,"rgba(90,110,150,.3)",1,"2 5"]]
    .forEach(([la,st,w,da])=>{const g=[];for(let lo=0;lo<=360;lo+=4)g.push([la,lo]);
      path(g,Object.assign({stroke:st,"stroke-width":w},da?{"stroke-dasharray":da}:{}));});
  /* computed day/night terminator + subsolar point */
  {const dd=refDayNo(),ls=sunLon(dd).lon,ee=obliq(dd);
   const aS=atan2d(S(ls)*C(ee),C(ls)), latS=Math.asin(S(ls)*S(ee))*R2D;
   const lonS=((aS-gmst(dd))%360+540)%360-180;
   const n=[C(latS)*C(lonS),C(latS)*S(lonS),S(latS)];
   const e1=[-S(lonS),C(lonS),0];
   const e2=[n[1]*e1[2]-n[2]*e1[1],n[2]*e1[0]-n[0]*e1[2],n[0]*e1[1]-n[1]*e1[0]];
   const g=[];for(let t=0;t<=360;t+=3){const v=[e1[0]*C(t)+e2[0]*S(t),e1[1]*C(t)+e2[1]*S(t),e1[2]*C(t)+e2[2]*S(t)];
     g.push([Math.asin(v[2])*R2D,atan2d(v[1],v[0])]);}
   path(g,{stroke:"var(--amber)","stroke-width":1.6,"stroke-opacity":.85});
   const ps=orthoXY(latS,lonS,cx,cy,R);
   if(ps){svg.appendChild(E("circle",{cx:ps[0],cy:ps[1],r:5,fill:"var(--sun)",style:"filter:drop-shadow(0 0 7px var(--sun))"}));
     svg.appendChild(T(ps[0],ps[1]-8,"subsolar · day side",{fill:"var(--amber)","font-size":7.5,"text-anchor":"middle","font-family":"var(--mono)"}));}}
  const p=orthoXY(state.lat,state.lon,cx,cy,R);
  if(p){svg.appendChild(E("circle",{cx:p[0],cy:p[1],r:5,fill:"none",stroke:"var(--cy2)","stroke-width":2,style:"filter:drop-shadow(0 0 5px var(--cy))"}));
        svg.appendChild(E("circle",{cx:p[0],cy:p[1],r:1.8,fill:"var(--cy2)"}));}
  const gr=document.getElementById("globeRead");if(gr)gr.textContent=state.lat.toFixed(2)+"°, "+state.lon.toFixed(2)+"°";
}
function setupGlobe(){
  const svg=document.getElementById("globe");if(!svg)return;
  svg.addEventListener("pointerdown",ev=>{gl.drag={x:ev.clientX,y:ev.clientY,l0:gl.lam0,p0:gl.phi0};gl.moved=0;try{svg.setPointerCapture(ev.pointerId);}catch(e){}ev.preventDefault();});
  svg.addEventListener("pointermove",ev=>{if(!gl.drag)return;
    const dx=ev.clientX-gl.drag.x,dy=ev.clientY-gl.drag.y;gl.moved+=Math.abs(dx)+Math.abs(dy);
    gl.lam0=gl.drag.l0-dx*0.7;gl.phi0=Math.max(-85,Math.min(85,gl.drag.p0+dy*0.7));
    if(!gl.raf)gl.raf=requestAnimationFrame(()=>{renderGlobe();gl.raf=0;});ev.preventDefault();});
  svg.addEventListener("pointerup",ev=>{
    if(gl.drag&&gl.moved<6){
      const r=svg.getBoundingClientRect();const sc=300/r.width;
      const x=(ev.clientX-r.left)*sc-150,y=-((ev.clientY-r.top)*sc-150);const R=140;
      const rho=Math.hypot(x,y);
      if(rho<=R){const c=Math.asin(Math.min(1,rho/R))*R2D;
        const lat=Math.asin(C(c)*S(gl.phi0)+(rho?y*S(c)*C(gl.phi0)/rho:0))*R2D;
        const lon=gl.lam0+atan2d(x*S(c),rho*C(gl.phi0)*C(c)-y*S(gl.phi0)*S(c));
        state.lat=Math.round(lat*100)/100;state.lon=Math.round((((lon+180)%360+360)%360-180)*100)/100;
        document.getElementById("lat").value=state.lat;document.getElementById("lon").value=state.lon;
        syncFine();renderGlobe();refreshMoment();}}
    gl.drag=null;});
  svg.addEventListener("pointercancel",()=>gl.drag=null);
  const gb=document.getElementById("globeBtn");
  if(gb)gb.onclick=()=>{const w=document.getElementById("globeWrap");const on=w.style.display==="none";w.style.display=on?"block":"none";if(on)renderGlobe();};
  const gp=document.getElementById("gpsBtn");
  if(gp)gp.onclick=()=>{
    const gr=document.getElementById("globeRead");
    if(!navigator.geolocation){if(gr)gr.textContent="no geolocation on this device";return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      state.lat=Math.round(pos.coords.latitude*100)/100;state.lon=Math.round(pos.coords.longitude*100)/100;
      document.getElementById("lat").value=state.lat;document.getElementById("lon").value=state.lon;
      syncFine();renderGlobe();refreshMoment();},
      ()=>{if(gr)gr.textContent="GPS denied/unavailable";});};
}

/* ---- eclipse geometry: drag the Moon, time follows ---- */
/* screen mapping: δ = ecliptic longitude minus Sun's; Sun drawn LEFT.
   X(δ)=cx−R·cosδ, Y(δ)=cy+R·sinδ  (new δ=0 → left; full δ=180 → right, into Earth's shadow) */
function renderEclGeo(){
  const svg=clr("eclGeo");if(!svg)return;const cx=210,cy=120,Ro=86;
  const d=refDayNo();const e=elongOf(d);const nd=rev(ELEM.Moon(d).N);const sl=sunLon(d).lon;
  const beta=moonLatf(d);
  const PT=(dl,r)=>[cx-r*C(dl),cy+r*S(dl)];
  svg.appendChild(T(16,cy-28,"☀",{fill:"var(--sun)","font-size":26,style:"filter:drop-shadow(0 0 8px var(--sun))"}));
  svg.appendChild(T(20,cy-6,"Sun",{fill:"var(--dim)","font-size":8.5,"font-family":"var(--mono)"}));
  svg.appendChild(E("line",{x1:40,y1:cy,x2:cx+Ro+38,y2:cy,stroke:"rgba(255,200,80,.25)","stroke-dasharray":"3 4"}));
  svg.appendChild(E("path",{d:`M ${cx+10} ${cy-7} L ${cx+Ro+34} ${cy-2.5} L ${cx+Ro+34} ${cy+2.5} L ${cx+10} ${cy+7} Z`,fill:"rgba(60,60,90,.35)"}));
  svg.appendChild(E("circle",{cx,cy,r:10,fill:"#2b6cb0",stroke:"rgba(120,200,255,.7)"}));
  svg.appendChild(T(cx,cy+24,"Earth",{fill:"var(--dim)","font-size":8.5,"text-anchor":"middle","font-family":"var(--mono)"}));
  svg.appendChild(E("circle",{cx,cy,r:Ro,fill:"none",stroke:"rgba(90,110,150,.3)"}));
  const dn=rev(nd-sl);
  const [n1x,n1y]=PT(dn,Ro*1.12),[n2x,n2y]=PT(dn+180,Ro*1.12);
  svg.appendChild(E("line",{x1:n1x,y1:n1y,x2:n2x,y2:n2y,stroke:"var(--rahu)","stroke-width":1.4,"stroke-dasharray":"6 4"}));
  const [l1x,l1y]=PT(dn,Ro*1.24),[l2x,l2y]=PT(dn+180,Ro*1.24);
  svg.appendChild(T(l1x,l1y+4,"☊",{fill:"var(--rahu)","font-size":13,"text-anchor":"middle","font-family":"var(--mono)"}));
  svg.appendChild(T(l2x,l2y+4,"☋",{fill:"var(--rahu)","font-size":13,"text-anchor":"middle","font-family":"var(--mono)"}));
  const [mx,my]=PT(e,Ro);
  const ph=phaseInfo(d);
  moonIcon(svg,mx,my,8,ph.illum,ph.waxing);
  svg.appendChild(E("circle",{cx:mx,cy:my,r:13,fill:"none",stroke:"var(--cy2)","stroke-opacity":.55,"stroke-dasharray":"2 3"}));
  svg.appendChild(T(20,20,"plan view · not to scale",{fill:"var(--faint)","font-size":8.5,"font-family":"var(--mono)"}));
  const sx=430,sw=110,sy=cy;
  svg.appendChild(T(sx+sw/2,20,"edge-on · β ×10",{fill:"var(--faint)","font-size":8.5,"text-anchor":"middle","font-family":"var(--mono)"}));
  svg.appendChild(E("rect",{x:sx,y:sy-15,width:sw,height:30,fill:"rgba(255,120,80,.07)"}));
  svg.appendChild(E("line",{x1:sx,y1:sy,x2:sx+sw,y2:sy,stroke:"rgba(70,199,214,.4)"}));
  const by=sy-beta*22;
  svg.appendChild(E("circle",{cx:sx+sw/2,cy:by,r:6,fill:"var(--moon)"}));
  svg.appendChild(T(sx+sw/2,by-10,`β ${beta>=0?"+":""}${beta.toFixed(2)}°`,{fill:"var(--moon)","font-size":9,"text-anchor":"middle","font-family":"var(--mono)"}));
  svg.appendChild(T(sx+sw+4,sy+3,"ecliptic",{fill:"var(--cy2)","font-size":8,"font-family":"var(--mono)"}));
  const dist=Math.min(angsep(sl,nd),angsep(sl,nd+180));
  const rd=document.getElementById("eclGeoRead");
  if(rd)rd.innerHTML=`elong <b>${e.toFixed(1)}°</b> · Sun–node <b>${dist.toFixed(1)}°</b> · β ${beta.toFixed(2)}°`+
    (dist<18.4&&(e<15||e>345)?" · <span style='color:var(--amber)'>solar-eclipse window</span>":
     dist<12.2&&Math.abs(e-180)<15?" · <span style='color:var(--amber)'>lunar-eclipse window</span>":"");
  svg.__moonPos={mx,my,cx,cy};
}
function setupEclGeo(){
  const svg=document.getElementById("eclGeo");if(!svg)return;let dr=null;
  svg.addEventListener("pointerdown",ev=>{const r=svg.getBoundingClientRect();const sc=560/r.width;
    const x=(ev.clientX-r.left)*sc,y=(ev.clientY-r.top)*sc;const mp=svg.__moonPos;if(!mp)return;
    if(Math.hypot(x-mp.mx,y-mp.my)<26){dr={raf:0};try{svg.setPointerCapture(ev.pointerId);}catch(e){}ev.preventDefault();}});
  svg.addEventListener("pointermove",ev=>{if(!dr)return;
    const r=svg.getBoundingClientRect();const sc=560/r.width;const mp=svg.__moonPos;
    const x=(ev.clientX-r.left)*sc,y=(ev.clientY-r.top)*sc;
    const tgt=atan2d(y-mp.cy,-(x-mp.cx));
    const t=solveElong(refDayNo(),tgt);setMomentFromDayNo(t);
    if(!dr.raf)dr.raf=requestAnimationFrame(()=>{refreshMoment();if(dr)dr.raf=0;});
    ev.preventDefault();});
  const end=()=>{if(dr){dr=null;refreshMoment();}};
  svg.addEventListener("pointerup",end);svg.addEventListener("pointercancel",end);
  const jump=dir=>{const d0=refDayNo();const list=dir>0?eclipses(d0+1,d0+560):eclipses(d0-560,d0-1);
    if(!list.length)return;const e=dir>0?list[0]:list[list.length-1];
    setMomentFromDayNo(e.d);refreshMoment();};
  const pb=document.getElementById("prevEcl");if(pb)pb.onclick=()=>jump(-1);
  const nb=document.getElementById("nextEcl");if(nb)nb.onclick=()=>jump(+1);
}
function setMomentFromDayNo(d){
  const tzh=state.tz||0;const jd=d+tzh/24+2451543.5;let z=Math.floor(jd+0.5);const F=jd+0.5-z;
  let a=z;if(z>=2299161){const al=Math.floor((z-1867216.25)/36524.25);a=z+1+al-Math.floor(al/4);}
  const b=a+1524,c=Math.floor((b-122.1)/365.25),dsz=Math.floor(365.25*c),ee=Math.floor((b-dsz)/30.6001);
  const day=b-dsz-Math.floor(30.6001*ee);const mo=ee<14?ee-1:ee-13;const yr=mo>2?c-4716:c-4715;
  const mins=Math.min(1439,Math.round(F*1440));const h=Math.floor(mins/60),mi=mins%60;
  state.refDate=`${yr}-${String(mo).padStart(2,"0")}-${String(Math.floor(day)).padStart(2,"0")}`;
  state.refTime=`${String(h).padStart(2,"0")}:${String(mi).padStart(2,"0")}`;
  document.getElementById("refDate").value=state.refDate;document.getElementById("refTime").value=state.refTime;
  syncFine();
}

/* ---- ascendant drag on skydial: solve nearest time ---- */
function setupAscDrag(){
  const svg=document.getElementById("skydial");if(!svg)return;let dr=null;
  svg.addEventListener("pointerdown",ev=>{
    const r=svg.getBoundingClientRect();const sc=400/r.width;
    const x=(ev.clientX-r.left)*sc-200,y=(ev.clientY-r.top)*sc-200;
    const ang=rev(Math.atan2(y,x)*R2D+90);
    const ascD=siderealAdj(ascendant(refDayNo(),state.lat,state.lon),refYear());
    let dd=Math.abs(rev(ang-ascD));if(dd>180)dd=360-dd;
    if(dd<14&&Math.hypot(x,y)>60){dr={raf:0};try{svg.setPointerCapture(ev.pointerId);}catch(e){}ev.preventDefault();}});
  svg.addEventListener("pointermove",ev=>{if(!dr)return;
    const r=svg.getBoundingClientRect();const sc=400/r.width;
    const x=(ev.clientX-r.left)*sc-200,y=(ev.clientY-r.top)*sc-200;
    const targD=rev(Math.atan2(y,x)*R2D+90);
    const targTrop=state.zodiac==="sidereal"?rev(targD+ayan(refYear())):targD;
    const t=solveAsc(refDayNo(),targTrop,state.lat,state.lon);
    setMomentFromDayNo(t);
    if(!dr.raf)dr.raf=requestAnimationFrame(()=>{refreshMoment();if(dr)dr.raf=0;});
    ev.preventDefault();});
  const end=()=>{if(dr){dr=null;refreshMoment();}};
  svg.addEventListener("pointerup",end);svg.addEventListener("pointercancel",end);
}

/* ---- live mode ---- */
let liveTimer=null;
function setLive(on){
  const b=document.getElementById("liveBtn");
  if(on&&!liveTimer){liveTimer=setInterval(()=>{const n=new Date();
    state.refDate=n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0");
    state.refTime=String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0");
    document.getElementById("refDate").value=state.refDate;document.getElementById("refTime").value=state.refTime;
    syncFine();refreshMoment();},1000);if(b)b.classList.add("on");}
  else if(!on&&liveTimer){clearInterval(liveTimer);liveTimer=null;if(b)b.classList.remove("on");}
}


function syncTabs(){document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("on",t.dataset.v===state.view));document.querySelectorAll(".view").forEach(v=>v.classList.toggle("on",v.id==="v-"+state.view));}
function renderView(){({orrery:renderInstrument,timeline:renderStave,wave:renderWave,spectrum:renderSpectrum,chaos:renderChaos,lagna:renderLagna,sky:renderSky,almanac:renderAlmanac,optimize:()=>{if(!lastOpt.length)renderOpt();else buildPrompt();}})[state.view]();}
function readCtl(){
  state.anchor=parseFloat(document.getElementById("anchor").value)||state.anchor;
  state.tol=Math.max(0,parseFloat(document.getElementById("tol").value)||0);
  state.refDate=document.getElementById("refDate").value||state.refDate;
  state.refTime=document.getElementById("refTime").value||state.refTime;
  state.tz=parseFloat(document.getElementById("tz").value)||0;
  state.lat=parseFloat(document.getElementById("lat").value)||0;
  state.lon=parseFloat(document.getElementById("lon").value)||0;
}
function syncFine(){
  const fd=document.getElementById("fDate");if(fd&&document.activeElement!==fd)fd.value=state.refDate;
  const [h,mi]=state.refTime.split(":").map(Number);const ft=document.getElementById("fTime");
  if(ft){if(document.activeElement!==ft)ft.value=h*60+mi;const L=document.getElementById("fTimeLbl");if(L)L.textContent=state.refTime;}
  const fl=document.getElementById("fLat");if(fl){if(document.activeElement!==fl)fl.value=state.lat;const L=document.getElementById("fLatLbl");if(L)L.textContent=state.lat.toFixed(2)+"°";}
  const fo=document.getElementById("fLon");if(fo){if(document.activeElement!==fo)fo.value=state.lon;const L=document.getElementById("fLonLbl");if(L)L.textContent=state.lon.toFixed(2)+"°";}
}
function refreshMoment(){renderMoment();syncFine();renderView();const gw=document.getElementById("globeWrap");if(gw&&gw.style.display!=="none")renderGlobe();buildPrompt();}
function renderAll(){
  state.events=parseEvents(document.getElementById("events").value);
  document.getElementById("evCount").textContent=state.events.length+" events parsed"+(state.events.length?" · "+state.events.map(e=>Math.round(e.t)).join(", "):"");
  renderChips();renderMoment();syncFine();renderView();buildPrompt();
}
function setWave(w){state.waveform=w;document.querySelectorAll(".wavesel button").forEach(x=>x.classList.toggle("on",x.dataset.w===w));if(state.view==="orrery")renderInstrument();if(document.getElementById("wave"))renderWave();buildPrompt();}


  /* ---- mount: bind DOM + boot (was top-level in v2) ---- */
  function mount(){
    document.querySelectorAll("#vgsel button").forEach(b=>b.onclick=()=>{state.varga=+b.dataset.v;
      document.querySelectorAll("#vgsel button").forEach(x=>x.classList.toggle("on",x===b));renderLagna();});
    document.querySelectorAll("#stysel button").forEach(b=>b.onclick=()=>{state.chartStyle=b.dataset.s;
      document.querySelectorAll("#stysel button").forEach(x=>x.classList.toggle("on",x===b));renderLagna();});
    setupRasiDrag();
document.getElementById("events").addEventListener("input",renderAll);
["anchor","tol","refDate","refTime","tz","lat","lon"].forEach(id=>document.getElementById(id).addEventListener("input",()=>{readCtl();renderAll();}));
document.getElementById("epochSlider").addEventListener("input",e=>{state.anchor=parseFloat(e.target.value);reflectEpoch();renderInstrument();});
document.getElementById("fDate").addEventListener("input",e=>{state.refDate=e.target.value;document.getElementById("refDate").value=e.target.value;refreshMoment();});
document.getElementById("fTime").addEventListener("input",e=>{const mn=+e.target.value;state.refTime=String(Math.floor(mn/60)).padStart(2,"0")+":"+String(mn%60).padStart(2,"0");document.getElementById("refTime").value=state.refTime;document.getElementById("fTimeLbl").textContent=state.refTime;refreshMoment();});
document.getElementById("fLat").addEventListener("input",e=>{state.lat=+e.target.value;document.getElementById("lat").value=state.lat;document.getElementById("fLatLbl").textContent=state.lat.toFixed(2)+"°";refreshMoment();});
document.getElementById("fLon").addEventListener("input",e=>{state.lon=+e.target.value;document.getElementById("lon").value=state.lon;document.getElementById("fLonLbl").textContent=state.lon.toFixed(2)+"°";refreshMoment();});
document.getElementById("nowBtn").onclick=()=>{const n=new Date();state.refDate=n.toISOString().slice(0,10);state.refTime=String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0");document.getElementById("refDate").value=state.refDate;document.getElementById("refTime").value=state.refTime;syncFine();refreshMoment();};
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{state.view=t.dataset.v;syncTabs();if(state.view==="optimize"&&!lastOpt.length)renderOpt();else renderView();});
document.querySelectorAll("#zodiacSeg button").forEach(b=>b.onclick=()=>{state.zodiac=b.dataset.z;document.querySelectorAll("#zodiacSeg button").forEach(x=>x.classList.toggle("on",x===b));renderMoment();renderView();buildPrompt();});
document.querySelectorAll(".wavesel button").forEach(b=>b.onclick=()=>setWave(b.dataset.w));
document.getElementById("showSum").onchange=e=>{state.showSum=e.target.checked;renderWave();};
document.getElementById("runOpt").onclick=renderOpt;
document.getElementById("runTile").onclick=renderTile;
document.getElementById("openClaude").onclick=()=>openAI("https://claude.ai/new?q=");
document.getElementById("openGPT").onclick=()=>openAI("https://chatgpt.com/?hints=search&q=");
document.getElementById("openPplx").onclick=()=>openAI("https://www.perplexity.ai/search?q=");
document.getElementById("copyPrompt").onclick=()=>{navigator.clipboard.writeText(buildPrompt());const b=document.getElementById("copyPrompt");b.textContent="✓ copied";setTimeout(()=>b.textContent="⧉ Copy prompt",1400);};

document.getElementById("foot").innerHTML="CHAKRA · self-contained, offline. Drag any ring to crank the shared epoch — every dial is geared to it by 1/period. Planetary positions, retrograde, moon phase, eclipses and all calendars computed locally (Schlyter ephemeris; Lahiri ayanāṁśa; tabular Hijrī; GMT-correlation Mayan) — arcminutes for luminaries, ~1° for outer planets; not a substitute for Swiss Ephemeris in professional work. © 1993–2026 Abhishek Choudhary.";


    readCtl();syncFine();renderAll();setupOrreryDrag();reflectEpoch();
    setupSky();setupGlobe();setupEclGeo();setupAscDrag();
    var lb=document.getElementById("liveBtn"); if(lb) lb.onclick=function(){setLive(!liveTimer);};
    makeEpochDrag("orreryWave",function(){var r=waveRange();return (r[1]-r[0])/574;});
    makeEpochDrag("wave",function(){var r=waveRange();return (r[1]-r[0])/1086;});
    makeEpochDrag("stave",function(){if(state.events.length<2)return 0.05;var t=state.events.map(function(e){return e.t;});return (Math.max.apply(null,t)-Math.min.apply(null,t)+4)/1082;});
  }
  return { mount: mount, state: function(){return state;}, kernel: Kernel };
});
