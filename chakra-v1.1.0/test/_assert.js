/* tiny assertion harness — no deps */
let P=0,F=0;const fails=[];
function ok(name,cond){if(cond){P++;}else{F++;fails.push(name);}console.log((cond?"  ok   ":"  FAIL ")+name);}
function near(name,got,exp,tol){ok(name+" ("+(+got).toFixed(4)+"≈"+exp+")",Math.abs(got-exp)<=(tol||1e-6));}
function eq(name,got,exp){ok(name+" ["+got+"]",String(got)===String(exp));}
function done(label){console.log("\n"+label+": "+P+" passed, "+F+" failed"+(F?"  → "+fails.join("; "):""));process.exitCode=F?1:0;return F;}
module.exports={ok,near,eq,done};
