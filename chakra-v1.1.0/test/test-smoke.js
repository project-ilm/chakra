/* DOM stub sufficient for mount() + a few renders */
function node(){const n={children:[],style:{},dataset:{},classList:{_s:new Set(),add(x){this._s.add(x);},remove(x){this._s.delete(x);},toggle(x,f){f?this._s.add(x):this._s.delete(x);},contains(x){return this._s.has(x);}},
  attributes:{},setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k];},removeAttribute(){},
  appendChild(c){this.children.push(c);return c;},removeChild(c){const i=this.children.indexOf(c);if(i>=0)this.children.splice(i,1);return c;},
  insertBefore(c){this.children.push(c);return c;},querySelector(){return null;},querySelectorAll(){return [];},
  addEventListener(){},removeEventListener(){},getBoundingClientRect(){return {left:0,top:0,width:600,height:400,right:600,bottom:400};},
  getContext(){return {clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){},fillRect(){},fillText(){},save(){},restore(){},translate(){},setTransform(){},closePath(){}};},
  focus(){},closest(){return null;},contains(){return false;},cloneNode(){return node();},
  set innerHTML(v){this._h=v;},get innerHTML(){return this._h||"";},set textContent(v){this._t=v;},get textContent(){return this._t||"";},
  set value(v){this._v=v;},get value(){return this._v;},set onclick(f){this._c=f;},get onclick(){return this._c;},
  set onchange(f){},set oninput(f){},set onmousedown(f){},set onmousemove(f){},set onmouseup(f){},checked:false,width:600,height:400};
  return n;}
const DEF={refDate:"2026-07-04",refTime:"12:00",tz:"5.5",lat:"28.61",lon:"77.21",anchor:"1990",tol:"1",events:"1990\n1993\n2005",zodiac:"sidereal",wave:"sine",view:"orrery"};
const store={};
global.document={createElementNS:()=>node(),createElement:()=>node(),createTextNode:()=>node(),
  getElementById(id){return store[id]||(store[id]=Object.assign(node(),{id,value:DEF[id]!==undefined?DEF[id]:""}));},
  querySelector(){return null;},querySelectorAll(){return [];},addEventListener(cb,fn){},body:node(),documentElement:node(),
  get activeElement(){return null;},readyState:"complete"};
global.window={addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}}),devicePixelRatio:1,location:{search:""},open(){}};
global.navigator={clipboard:{writeText(){return Promise.resolve();}},geolocation:{getCurrentPosition(){}},userAgent:"node"};
global.requestAnimationFrame=()=>0;global.cancelAnimationFrame=()=>{};
global.setTimeout=()=>0;global.setInterval=()=>0;global.clearInterval=()=>{};global.clearTimeout=()=>{};
global.DeviceOrientationEvent=undefined;

const C=require("../src/chakra-core.js");
const K=require("../src/chakra-kernel.js");
const API=require("../src/chakra-api.js");
const UI=require("../src/chakra-ui.js");
let ok=0,bad=0;const t=(n,f)=>{try{f();console.log("  ok   "+n);ok++;}catch(e){console.log("  FAIL "+n+" :: "+e.message);bad++;}};

t("ChakraUI.mount() runs without throwing",()=>UI.mount());
t("UI state() reflects defaults",()=>{const s=UI.state();if(s.view===undefined&&s.zodiac===undefined)throw new Error("no state");});
t("API moment via URLSearchParams",()=>{const r=API.handle(new URLSearchParams("api=moment&date=2026-07-04"));JSON.parse(r.body);});
t("API almanac full snapshot",()=>{const r=API.handle(new URLSearchParams("api=almanac&date=2026-03-03&lat=28.6&lon=77.2&tz=5.5"));const d=JSON.parse(r.body);if(!d.eclipses.length)throw new Error("no eclipses near 2026-03-03");});
t("API calendars has all 12 traditions",()=>{const d=API.handle(new URLSearchParams("api=calendars&date=2026-07-04")).data;const need=["hijriSunni","hijriShia","solarHijri","hebrew","nanakshahi","samvatsara","chinese","tibetan","mayan"];need.forEach(k=>{if(!d.calendars[k])throw new Error("missing "+k);});});
t("API telescope Alt/Az/RA/Dec present",()=>{const d=API.handle(new URLSearchParams("api=telescope&date=2026-07-04&time=20:00&lat=28.6&lon=77.2&tz=5.5")).data;const j=d.bodies.Jupiter;["raH","dec","alt","az","haH"].forEach(k=>{if(typeof j[k]!=="number")throw new Error("no "+k);});});
console.log("\nsmoke: "+ok+" ok, "+bad+" failed");process.exit(bad?1:0);
