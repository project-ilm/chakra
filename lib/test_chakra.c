/* test_chakra.c — parity harness: C port vs JS reference vectors.
 * Copyright (C) 1993-2026 Abhishek Choudhary. GPL-3.0-or-later. */
#include "chakra.h"
#include "vectors.h"
#include <stdio.h>
#include <string.h>
#include <math.h>

static int npass=0,nfail=0;
static void okd(const char*nm,int i,double got,double exp,double tol){
  if(fabs(got-exp)<=tol){npass++;return;}
  /* angles may legitimately differ by ~360 wrap at the 0/360 seam */
  double w=fabs(fmod(fabs(got-exp),360.0)); if(w>180)w=360-w;
  if(w<=tol){npass++;return;}
  nfail++; if(nfail<=20)printf("  FAIL %s[%d]: got %.12f exp %.12f (Δ%.3g)\n",nm,i,got,exp,got-exp);
}
static void oki(const char*nm,int i,long got,long exp){
  if(got==exp){npass++;return;}
  nfail++; if(nfail<=20)printf("  FAIL %s[%d]: got %ld exp %ld\n",nm,i,got,exp);
}
static void oks(const char*nm,int i,const char*got,const char*exp){
  if(!strcmp(got,exp)){npass++;return;}
  nfail++; if(nfail<=20)printf("  FAIL %s[%d]:\n    got %s\n    exp %s\n",nm,i,got,exp);
}

int main(void){
  const double TA=5e-7;      /* degrees */
  const double TD=2e-6;      /* days for solvers */
  puts("C↔JS PARITY");

  for(int i=0;i<NV;i++){
    double d=V_d[i],y=V_py[i];
    okd("sun",i,ck_sun_lon(d),V_sun[i],TA);
    okd("moon",i,ck_moon_lon(d),V_moon[i],TA);
    okd("mlat",i,ck_moon_lat(d),V_mlat[i],TA);
    okd("merc",i,ck_planet_lon(CK_MERCURY,d),V_merc[i],TA);
    okd("ven",i,ck_planet_lon(CK_VENUS,d),V_ven[i],TA);
    okd("mar",i,ck_planet_lon(CK_MARS,d),V_mar[i],TA);
    okd("jup",i,ck_planet_lon(CK_JUPITER,d),V_jup[i],TA);
    okd("sat",i,ck_planet_lon(CK_SATURN,d),V_sat[i],TA);
    okd("ura",i,ck_planet_lon(CK_URANUS,d),V_ura[i],TA);
    okd("nep",i,ck_planet_lon(CK_NEPTUNE,d),V_nep[i],TA);
    double g[CK_NBODY]; ck_grahas(d,g);
    okd("rahu",i,g[CK_RAHU],V_rahu[i],TA);
    okd("asc",i,ck_ascendant(d,V_lat,V_lon),V_asc[i],TA);
    okd("mc",i,ck_mc(d,V_lon),V_mcv[i],TA);
    okd("gmst",i,ck_gmst(d),V_gmst[i],1e-8);
    okd("obl",i,ck_obliq(d),V_obl[i],1e-12);
    okd("ayan",i,ck_ayan(y),V_ayan[i],1e-10);
    ck_phase ph; ck_phase_info(d,&ph);
    okd("elong",i,ph.elong,V_elong[i],TA);
    okd("illum",i,ph.illum,V_illum[i],1e-9);
    ck_panchanga p; ck_panchanga_calc(d,y,&p);
    oki("vara",i,p.vara_i,V_vara[i]);
    oki("tithi",i,p.tithi_i,V_tith[i]);
    oki("nak",i,p.nak_i,V_naki[i]);
    oki("yoga",i,p.yoga_i,V_yogi[i]);
    oki("karana",i,p.karana_i,V_kari[i]);
    oki("manzil",i,p.manzil_i,V_mani[i]);
  }

  for(int i=0;i<NJ;i++){
    long j=V_j[i];
    ck_ymd q; ck_hijri_tabular(j,0,&q);
    oki("suY",i,q.y,V_suy[i]); oki("suM",i,q.mi,V_sum[i]); oki("suD",i,q.d,V_sud[i]);
    ck_hijri_tabular(j,1,&q);
    oki("shY",i,q.y,V_shy[i]); oki("shM",i,q.mi,V_shm[i]); oki("shD",i,q.d,V_shd[i]);
    ck_heb h; ck_hebrew(j,&h);
    oki("hbY",i,h.y,V_hby[i]); oki("hbM",i,h.month_i,V_hbm[i]);
    oki("hbD",i,h.d,V_hbd[i]); oki("hbL",i,h.leap,V_hbl[i]);
    ck_nanak nk; ck_nanakshahi(j,&nk);
    oki("nkY",i,nk.y,V_nky[i]); oki("nkM",i,nk.month_i,V_nkm[i]); oki("nkD",i,nk.d,V_nkd[i]);
    ck_mayan m; ck_mayan_calc(j,&m);
    oki("mbk",i,m.baktun,V_mbk[i]); oki("mkt",i,m.katun,V_mkt[i]); oki("mtn",i,m.tun,V_mtn[i]);
    oki("mun",i,m.uinal,V_mun[i]); oki("mki",i,m.kin,V_mki[i]);
    oki("mtz",i,m.tz_num,V_mtz[i]); oki("mti",i,m.tz_name_i,V_mti[i]);
    oki("mhd",i,m.haab_day,V_mhd[i]); oki("mhm",i,m.haab_mo_i,V_mhm[i]);
    int Y,M,Dd,st,br; ck_jdn2greg(j,&Y,&M,&Dd);
    ck_chinese_year(Y,&st,&br);
    oki("cst",i,st,V_cst[i]); oki("cbr",i,br,V_cbr[i]);
    ck_greg2hijri(j,&q);
    oki("kuY",i,q.y,V_kuy[i]); oki("kuM",i,q.mi,V_kum[i]); oki("kuD",i,q.d,V_kud[i]);
    long j2=ck_greg2jdn(Y,M,Dd); oki("jdnRT",i,j2,j);
  }

  for(int i=0;i<NSE;i++)okd("solveE",i,ck_solve_elong(V_se_t0[i],V_se_tg[i]),V_se_r[i],TD);
  for(int i=0;i<NSA;i++)okd("solveA",i,ck_solve_asc(V_sa_t0[i],V_sa_tg[i],V_lat,V_lon),V_sa_r[i],TD);
  for(int i=0;i<NMY;i++){okd("mesha",i,ck_mesha_day(V_my[i]),V_mesha[i],TD);
                          okd("nowruz",i,ck_nowruz_day(V_my[i]),V_nowruz[i],TD);}
  for(int i=0;i<NSV;i++){ck_samv sv;ck_samv_info(V_svd[i],V_svy[i],&sv);
    oki("svi",i,sv.samv_i,V_svi[i]);oki("saka",i,sv.saka,V_svsk[i]);oki("vikr",i,sv.vikrama,V_svvk[i]);}
  for(int i=0;i<NSH;i++){ck_ymd r;ck_solar_hijri(V_shd2[i],V_shy2[i],&r);
    oki("shjY",i,r.y,V_sh_y[i]);oki("shjM",i,r.mi,V_sh_m[i]);oki("shjD",i,r.d,V_sh_d[i]);}

  { ck_ecl ec[12]; int ne=ck_eclipses(ck_dayno(2026,1,1,12),ck_dayno(2026,12,31,12),ec,12);
    oki("necl",0,ne,NEC);
    for(int i=0;i<ne&&i<NEC;i++){
      oki("eclJ",i,ck_jdn_of(ec[i].d),V_ec_j[i]);
      oki("eclS",i,ec[i].solar,V_ec_solar[i]);
      oki("eclC",i,ec[i].central,V_ec_central[i]);
      okd("eclD",i,ec[i].dist,V_ec_dist[i],1e-4);
    }
  }

  for(int i=0;i<NVM;i++){ck_vims v;ck_vimshottari(V_vm_ms[i],V_vm_by[i],&v);
    oki("vmNak",i,v.nak,V_vm_nak[i]);
    okd("vmBal",i,v.balance,V_vm_bal[i],1e-9);
    okd("vmS0",i,v.start[0],V_vm_s0[i],1e-9);}

  for(int i=0;i<NT;i++){
    ck_horiz t; ck_telescope(ck_planet_lon(CK_JUPITER,V_td[i]),0,V_td[i],V_lat,V_lon,&t);
    okd("tRA",i,t.ra,V_t_ra[i],TA);okd("tDE",i,t.dec,V_t_de[i],TA);
    okd("tAL",i,t.alt,V_t_al[i],TA);okd("tAZ",i,t.az,V_t_az[i],TA);okd("tHA",i,t.ha,V_t_ha[i],TA);}

  for(int i=0;i<ND2;i++){char b[20];ck_d2date(V_d2[i],b);oks("d2date",i,b,V_d2s[i]);}

  { ck_event ev[140]; char line[280];
    int n=ck_annual_events(2026,ev,140);
    oki("nev26",0,n,NEV2026);
    for(int i=0;i<n&&i<NEV2026;i++){
      snprintf(line,sizeof line,"%s|%s|%s|%s",ev[i].date,ev[i].name,ev[i].trad,ev[i].note);
      oks("ev26",i,line,V_ev2026[i]);}
    n=ck_annual_events(2027,ev,140);
    oki("nev27",0,n,NEV2027);
    for(int i=0;i<n&&i<NEV2027;i++){
      snprintf(line,sizeof line,"%s|%s|%s|%s",ev[i].date,ev[i].name,ev[i].trad,ev[i].note);
      oks("ev27",i,line,V_ev2027[i]);}
  }

  printf("\nparity: %d passed, %d failed\n",npass,nfail);
  return nfail?1:0;
}
