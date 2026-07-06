/* chakra_cli.c — command-line front end mirroring the URL API subset.
 * Usage: ./chakra <panchang|calendars|telescope|events|moment>
 *                 [date=YYYY-MM-DD] [time=HH:MM] [lat=] [lon=] [tz=] [year=]
 * Copyright (C) 1993-2026 Abhishek Choudhary. GPL-3.0-or-later. */
#include "chakra.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static const char*DISC="CHAKRA — low-precision heritage computation. Not for navigation, muhūrta-critical, or safety use. Astrological outputs are cultural, not predictive.";

int main(int argc,char**argv){
  const char*ep=argc>1?argv[1]:"moment";
  int Y=2026,M=7,Dd=4,hh=12,mi=0,year=0;
  double lat=17.385,lon=78.486,tz=5.5;
  for(int i=2;i<argc;i++){
    if(!strncmp(argv[i],"date=",5))sscanf(argv[i]+5,"%d-%d-%d",&Y,&M,&Dd);
    else if(!strncmp(argv[i],"time=",5))sscanf(argv[i]+5,"%d:%d",&hh,&mi);
    else if(!strncmp(argv[i],"lat=",4))lat=atof(argv[i]+4);
    else if(!strncmp(argv[i],"lon=",4))lon=atof(argv[i]+4);
    else if(!strncmp(argv[i],"tz=",3))tz=atof(argv[i]+3);
    else if(!strncmp(argv[i],"year=",5))year=atoi(argv[i]+5);
  }
  double d=ck_dayno(Y,M,Dd,hh+mi/60.0-tz);
  double y=Y+(M-1)/12.0;
  long jdn=ck_jdn_of(d);
  printf("{\n  \"generator\": \"chakra-core-c %s\",\n",CK_VERSION);
  printf("  \"input\": {\"date\":\"%04d-%02d-%02d\",\"time\":\"%02d:%02d\",\"lat\":%g,\"lon\":%g,\"tz\":%g},\n",Y,M,Dd,hh,mi,lat,lon,tz);

  if(!strcmp(ep,"panchang")||!strcmp(ep,"moment")){
    ck_panchanga p;ck_panchanga_calc(d,y,&p);
    ck_phase ph;ck_phase_info(d,&ph);
    printf("  \"panchanga\": {\"vara\":\"%s\",\"tithi\":\"%s (%s)\",\"nakshatra\":\"%s\",\"yoga\":\"%s\",\"karana\":\"%s\",\"manzil\":\"%s\"},\n",
      CK_VARA[p.vara_i],CK_TITHI[p.tithi_i%15],p.shukla?"Śukla":"Kṛṣṇa",
      CK_NAK[p.nak_i],CK_YOGA_N[p.yoga_i],ck_karana_name(p.karana_i),CK_MANAZIL[p.manzil_i]);
    printf("  \"moon\": {\"phase\":\"%s\",\"illum\":%.4f,\"elong\":%.4f},\n",CK_PHASE8[ph.name8],ph.illum,ph.elong);
  }
  if(!strcmp(ep,"calendars")||!strcmp(ep,"moment")){
    ck_ymd su,sh,ku,sj;ck_heb hb;ck_nanak nk;ck_samv sv;ck_mayan my;int st,br;
    ck_hijri_tabular(jdn,0,&su);ck_hijri_tabular(jdn,1,&sh);ck_greg2hijri(jdn,&ku);
    ck_hebrew(jdn,&hb);ck_nanakshahi(jdn,&nk);ck_samv_info(d,Y,&sv);
    ck_solar_hijri(d,Y,&sj);ck_mayan_calc(jdn,&my);ck_chinese_year(Y,&st,&br);
    printf("  \"calendars\": {\n");
    printf("    \"hijriSunni\":\"%d %s %d AH\",\n",su.d,CK_HIJRI_M[su.mi-1],su.y);
    printf("    \"hijriShia\":\"%d %s %d AH\",\n",sh.d,CK_HIJRI_M[sh.mi-1],sh.y);
    printf("    \"solarHijri\":\"%d %s %d SH\",\n",sj.d,CK_SH_M[sj.mi-1],sj.y);
    printf("    \"hebrew\":\"%d %s %d AM\",\n",hb.d,ck_heb_month_name(&hb),hb.y);
    printf("    \"nanakshahi\":\"%d %s %d NS\",\n",nk.d,CK_NANAK_M[nk.month_i],nk.y);
    printf("    \"samvatsara\":\"%s · Śaka %d · Vikrama %d\",\n",CK_SAMV[sv.samv_i],sv.saka,sv.vikrama);
    printf("    \"chinese\":\"%s %s\",\n",CK_STEM[st],CK_ANIM[br]);
    printf("    \"mayanLC\":\"%ld.%d.%d.%d.%d\"\n  },\n",my.baktun,my.katun,my.tun,my.uinal,my.kin);
  }
  if(!strcmp(ep,"telescope")||!strcmp(ep,"moment")){
    double g[CK_NBODY];ck_grahas(d,g);
    printf("  \"telescope\": {\n");
    for(int b=0;b<9;b++){
      int bi=b<7?b:(b==7?CK_RAHU:CK_KETU);
      ck_horiz t;ck_telescope(g[bi],bi==CK_MOON?ck_moon_lat(d):0,d,lat,lon,&t);
      printf("    \"%s\": {\"raH\":%.4f,\"dec\":%.3f,\"alt\":%.3f,\"az\":%.3f,\"haH\":%.4f}%s\n",
        CK_BODY_NAME[bi],t.raH,t.dec,t.alt,t.az,t.haH,b<8?",":"");
    }
    printf("  },\n");
  }
  if(!strcmp(ep,"events")){
    ck_event ev[140];int n=ck_annual_events(year?year:Y,ev,140);
    printf("  \"year\": %d,\n  \"events\": [\n",year?year:Y);
    for(int i=0;i<n;i++)
      printf("    {\"date\":\"%s\",\"name\":\"%s\",\"tradition\":\"%s\",\"note\":\"%s\"}%s\n",
             ev[i].date,ev[i].name,ev[i].trad,ev[i].note,i<n-1?",":"");
    printf("  ],\n");
  }
  printf("  \"disclaimer\": \"%s\"\n}\n",DISC);
  return 0;
}
