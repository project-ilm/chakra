/* test-voyage.js — relativistic tour engine checks.
 * © 1993-2026 Abhishek Choudhary · GPL-3.0-or-later */
const {ok,done}=require("./_assert.js");
const V=require("../src/chakra-voyage.js");
const near=(a,b,t)=>Math.abs(a-b)<=t;

ok("γ(0)=1",V.gamma(0)===1);
ok("γ(0.8)=5/3",near(V.gamma(0.8),5/3,1e-12));
ok("γ(0.9999)≈70.71",near(V.gamma(0.9999),70.71,0.02));
ok("γ(1) undefined",Number.isNaN(V.gamma(1)));
ok("ship time dilates",V.shipYears(10,0.9)<V.earthYears(10,0.9));
const p=V.plan(4.367,0.5,2030);
ok("αCen @0.5c Earth-frame 8.734y",near(p.earthYears,8.734,1e-3));
ok("αCen @0.5c ship 7.564y",near(p.shipYears,4.367/0.5*Math.sqrt(0.75),1e-9));
ok("arrival year",near(p.arriveEarthYear,2038.734,1e-3));
ok("faster β → less ship time",V.shipYears(100,0.99)<V.shipYears(100,0.5));
ok("catalog ≥ 26 stars",V.STARS.length>=26);
ok("Proxima is nearest",V.STARS.reduce((m,s)=>s.ly<m.ly?s:m).nm.indexOf("Proxima")===0);
ok("TRAPPIST-1 present",!!V.findStar("trappist"));
ok("Andromeda easter egg",V.findStar("andromeda").ly>2e6);
const t=V.tour([{ly:4.367,beta:0.5},{ly:4.24,beta:0.5}],2030);
ok("tour sums legs",near(t.earthYears,(4.367+4.24)/0.5,1e-9)&&t.legs.length===2);
ok("tour aging saved > 0",t.agingSaved>0);
done("test-voyage");
