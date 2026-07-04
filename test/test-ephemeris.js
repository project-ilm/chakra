const C=require("../src/chakra-core.js");const {ok,near,eq,done}=require("./_assert.js");
const dn=(Y,M,D,h)=>C.dayNo(Y,M,D,(h||0));
console.log("EPHEMERIS & SKY");
// Spica sidereal = 180 (Citra-paksha definition) via star pipeline replicated from RA/Dec
function radec2ecl(a,d){const e=23.4392911;return{lam:C.atan2d(C.S(a)*C.C(e)+C.Tn(d)*C.S(e),C.C(a)),bet:Math.asin(C.S(d)*C.C(e)-C.C(d)*C.S(e)*C.S(a))*C.R2D};}
near("Spica sidereal ≈ 180° (Lahiri definition)",C.rev(radec2ecl(201.298,-11.161).lam-C.ayan(2000)),180,0.05);
near("Regulus sidereal ≈ 126° (Maghā)",C.rev(radec2ecl(152.093,11.967).lam-C.ayan(2000)),125.98,0.1);
// 2026 eclipses on real dates
const ecl=C.eclipses(dn(2026,1,1),dn(2026,12,31));const dates=ecl.map(e=>C.d2date(e.d));
ok("2026 annular solar 17 Feb",dates.indexOf("2026-02-17")>=0);
ok("2026 total lunar 3 Mar",dates.indexOf("2026-03-03")>=0);
ok("2026 total solar 12 Aug",dates.indexOf("2026-08-12")>=0);
ok("2026 partial lunar 28 Aug",dates.indexOf("2026-08-28")>=0);
// Moon phase exactness
near("Full moon 2026-06-29 elongation≈180",C.elongOf(C.solveElong(dn(2026,7,1),180)),180,0.01);
eq("nearest full from 2026-07-01 is 2026-06-29",C.d2date(C.solveElong(dn(2026,7,1),180)),"2026-06-29");
// Ascendant solver
const a0=C.ascendant(dn(2026,7,4,1),28.61,77.21);const ts=C.solveAsc(dn(2026,7,4,1),C.rev(a0+45),28.61,77.21);
near("ascendant solver hits target",Math.abs(C.rev(C.ascendant(ts,28.61,77.21)-(a0+45))),0,0.01);
// Telescope: Polaris Dec≈+89
const pol=radec2ecl(37.955,89.264);const t=C.telescope(pol.lam+0.0139552*26,pol.bet,dn(2026,7,4),28.61,77.21);
near("Polaris Dec ≈ +89°",t.dec,89.3,0.3);
done("test-ephemeris");
