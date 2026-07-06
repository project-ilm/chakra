/* test-orbits.js — Keplerian shape checks for the true-orbit orrery,
 * driven straight from the core's Schlyter elements.
 * © 1993-2026 Abhishek Choudhary · GPL-3.0-or-later */
const {ok,done}=require("./_assert.js");
const C=require("../src/chakra-core.js");
const near=(a,b,t)=>Math.abs(a-b)<=t;
const d=C.dayNo(2026,7,4,12);

const me=C.ELEM.Mercury(d);
ok("Mercury perihelion ≈0.3075 AU",near(me.a*(1-me.e),0.3075,0.002));
ok("Mercury aphelion ≈0.4667 AU",near(me.a*(1+me.e),0.4667,0.002));
const su=C.ELEM.Sun(d);
ok("Earth eccentricity ≈0.0167",near(su.e,0.0167,3e-4));
const ne=C.ELEM.Neptune(d);
ok("Neptune aphelion ≈30.3 AU",near(ne.a*(1+ne.e),30.32,0.1));
const ma=C.ELEM.Mars(d);
ok("Mars perihelion/aphelion ratio",near((ma.a*(1-ma.e))/(ma.a*(1+ma.e)),(1-ma.e)/(1+ma.e),1e-12));
/* Kepler solver consistency: E − (180/π)·e·sinE − M ≈ 0 */
const E=C.kepler(137.3,0.2);
ok("kepler(M,e) satisfies Kepler's equation",
   near(E-(180/Math.PI)*0.2*Math.sin(E*Math.PI/180)-137.3,0,1e-9));
/* helio radius at perihelion equals a(1−e) when M=0 */
const h0=C.helio({N:0,i:0,w:0,a:1.5,e:0.3,M:0});
ok("helio at M=0 gives r=a(1−e)",near(h0.r,1.5*0.7,1e-9));
done("test-orbits");
