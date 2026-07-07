/*
 * chakra.c — C99 port of src/chakra-core.js. Same algorithms, same constants,
 * same strings. Parity is enforced by test_chakra.c against vectors generated
 * from the JS reference (make vectors && make test).
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Distributed WITHOUT ANY WARRANTY. See <https://www.gnu.org/licenses/>.
 *
 * DISCLAIMER: low-precision ephemeris — study/heritage computation only;
 * not for navigation, muhūrta-critical, or safety-critical use.
 */
#include "chakra.h"
#include <math.h>
#include <stdio.h>
#include <string.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#define D2R (M_PI/180.0)
#define R2D (180.0/M_PI)
static double S_(double x){return sin(x*D2R);}
static double C_(double x){return cos(x*D2R);}
static double T_(double x){return tan(x*D2R);}
static double at2(double y,double x){return ck_rev(atan2(y,x)*R2D);}

double ck_rev(double x){double r=fmod(x,360.0);return r<0?r+360.0:r;}

/* ── name tables (byte-identical to the JS core) ─────────────────────── */
const char *CK_BODY_NAME[CK_NBODY]={"Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Rahu","Ketu"};
const char *CK_RASHI[12]={"Meṣa","Vṛṣabha","Mithuna","Karka","Siṃha","Kanyā","Tulā","Vṛścika","Dhanu","Makara","Kumbha","Mīna"};
const char *CK_SIGNS_EN[12]={"Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"};
const char *CK_NAK[27]={"Aśvinī","Bharaṇī","Kṛttikā","Rohiṇī","Mṛgaśira","Ārdrā","Punarvasu","Puṣya","Āśleṣā","Maghā","P.Phalgunī","U.Phalgunī","Hasta","Chitrā","Svātī","Viśākhā","Anurādhā","Jyeṣṭhā","Mūla","P.Āṣāḍhā","U.Āṣāḍhā","Śravaṇa","Dhaniṣṭhā","Śatabhiṣā","P.Bhādra","U.Bhādra","Revatī"};
const char *CK_VARA[7]={"Ravivāra","Somavāra","Maṅgalavāra","Budhavāra","Guruvāra","Śukravāra","Śanivāra"};
const char *CK_TITHI[15]={"Pratipadā","Dvitīyā","Tṛtīyā","Chaturthī","Pañchamī","Ṣaṣṭhī","Saptamī","Aṣṭamī","Navamī","Daśamī","Ekādaśī","Dvādaśī","Trayodaśī","Chaturdaśī","Pūrṇimā/Amāvāsyā"};
const char *CK_YOGA_N[27]={"Viṣkambha","Prīti","Āyuṣmān","Saubhāgya","Śobhana","Atigaṇḍa","Sukarman","Dhṛti","Śūla","Gaṇḍa","Vṛddhi","Dhruva","Vyāghāta","Harṣaṇa","Vajra","Siddhi","Vyatīpāta","Varīyān","Parigha","Śiva","Siddha","Sādhya","Śubha","Śukla","Brahma","Indra","Vaidhṛti"};
const char *CK_KAR_MOV[7]={"Bava","Bālava","Kaulava","Taitila","Garaja","Vaṇija","Viṣṭi"};
const char *CK_KAR_FIX[4]={"Kiṃstughna","Śakuni","Chatuṣpāda","Nāga"};
const char *CK_MANAZIL[28]={"ash-Sharaṭān","al-Buṭayn","ath-Thurayyā","ad-Dabarān","al-Haqʿah","al-Hanʿah","adh-Dhirāʿ","an-Nathrah","aṭ-Ṭarf","al-Jabhah","az-Zubrah","aṣ-Ṣarfah","al-ʿAwwāʾ","as-Simāk","al-Ghafr","az-Zubānā","al-Iklīl","al-Qalb","ash-Shaulah","an-Naʿāʾim","al-Baldah","saʿd adh-Dhābiḥ","saʿd Bulaʿ","saʿd as-Suʿūd","saʿd al-Akhbiyah","al-Fargh al-Muqaddam","al-Fargh al-Muʾakhkhar","Baṭn al-Ḥūt"};
const char *CK_SAMV[60]={"Prabhava","Vibhava","Śukla","Pramoda","Prajāpati","Aṅgirasa","Śrīmukha","Bhāva","Yuva","Dhātā","Īśvara","Bahudhānya","Pramādī","Vikrama","Vṛṣa","Chitrabhānu","Svabhānu","Tāraṇa","Pārthiva","Vyaya","Sarvajit","Sarvadhārī","Virodhī","Vikṛti","Khara","Nandana","Vijaya","Jaya","Manmatha","Durmukhī","Hevilambī","Vilambī","Vikārī","Śārvarī","Plava","Śubhakṛt","Śobhakṛt","Krodhī","Viśvāvasu","Parābhava","Plavaṅga","Kīlaka","Saumya","Sādhāraṇa","Virodhikṛt","Paridhāvī","Pramādīcha","Ānanda","Rākṣasa","Nala","Piṅgala","Kālayukta","Siddhārthī","Raudra","Durmati","Dundubhi","Rudhirodgārī","Raktākṣī","Krodhana","Akṣaya"};
const char *CK_HIJRI_M[12]={"Muḥarram","Ṣafar","Rabīʿ I","Rabīʿ II","Jumādā I","Jumādā II","Rajab","Shaʿbān","Ramaḍān","Shawwāl","Dhū al-Qaʿdah","Dhū al-Ḥijjah"};
const char *CK_SH_M[12]={"Farvardīn","Ordībehesht","Khordād","Tīr","Mordād","Shahrīvar","Mehr","Ābān","Āzar","Dey","Bahman","Esfand"};
const char *CK_HEB_M12[12]={"Tishri","Cheshvan","Kislev","Tevet","Shevat","Adar","Nisan","Iyar","Sivan","Tammuz","Av","Elul"};
const char *CK_HEB_M13[13]={"Tishri","Cheshvan","Kislev","Tevet","Shevat","Adar I","Adar II","Nisan","Iyar","Sivan","Tammuz","Av","Elul"};
const char *CK_NANAK_M[12]={"Chet","Vaisakh","Jeth","Harh","Sawan","Bhadon","Assu","Katak","Maghar","Poh","Magh","Phagun"};
const char *CK_TZ_NAMES[20]={"Imix","Ik","Akbal","Kan","Chicchan","Cimi","Manik","Lamat","Muluc","Oc","Chuen","Eb","Ben","Ix","Men","Cib","Caban","Etznab","Cauac","Ahau"};
const char *CK_HAAB_NAMES[19]={"Pop","Wo","Sip","Sotz","Sek","Xul","Yaxkin","Mol","Chen","Yax","Sak","Keh","Mak","Kankin","Muwan","Pax","Kayab","Kumku","Wayeb"};
const char *CK_STEM[10]={"Wood-Yang","Wood-Yin","Fire-Yang","Fire-Yin","Earth-Yang","Earth-Yin","Metal-Yang","Metal-Yin","Water-Yang","Water-Yin"};
const char *CK_ANIM[12]={"Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"};
const char *CK_SNAME[12]={"Meṣa","Vṛṣabha","Mithuna","Karka","Siṃha","Kanyā","Tulā","Vṛścika","Dhanu","Makara","Kumbha","Mīna"};
const char *CK_AMONTH[12]={"Caitra","Vaiśākha","Jyaiṣṭha","Āṣāḍha","Śrāvaṇa","Bhādrapada","Āśvina","Kārtika","Mārgaśīrṣa","Pauṣa","Māgha","Phālguna"};
const char *CK_PHASE8[8]={"New Moon","Waxing Crescent","First Quarter","Waxing Gibbous","Full Moon","Waning Gibbous","Last Quarter","Waning Crescent"};
const char *CK_VIM_LORDS[9]={"Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"};

/* ── orbital elements (Schlyter) ─────────────────────────────────────── */
typedef struct { double N,i,w,a,e,M; } elem;
static void get_elem(int body,double d,elem*o){
  switch(body){
  case CK_SUN:    o->N=0;o->i=0;o->w=282.9404+4.70935e-5*d;o->a=1;o->e=0.016709-1.151e-9*d;o->M=356.0470+0.9856002585*d;break;
  case CK_MOON:   o->N=125.1228-0.0529538083*d;o->i=5.1454;o->w=318.0634+0.1643573223*d;o->a=60.2666;o->e=0.054900;o->M=115.3654+13.0649929509*d;break;
  case CK_MERCURY:o->N=48.3313+3.24587e-5*d;o->i=7.0047+5.00e-8*d;o->w=29.1241+1.01444e-5*d;o->a=0.387098;o->e=0.205635+5.59e-10*d;o->M=168.6562+4.0923344368*d;break;
  case CK_VENUS:  o->N=76.6799+2.46590e-5*d;o->i=3.3946+2.75e-8*d;o->w=54.8910+1.38374e-5*d;o->a=0.723330;o->e=0.006773-1.302e-9*d;o->M=48.0052+1.6021302244*d;break;
  case CK_MARS:   o->N=49.5574+2.11081e-5*d;o->i=1.8497-1.78e-8*d;o->w=286.5016+2.92961e-5*d;o->a=1.523688;o->e=0.093405+2.516e-9*d;o->M=18.6021+0.5240207766*d;break;
  case CK_JUPITER:o->N=100.4542+2.76854e-5*d;o->i=1.3030-1.557e-7*d;o->w=273.8777+1.64505e-5*d;o->a=5.20256;o->e=0.048498+4.469e-9*d;o->M=19.8950+0.0830853001*d;break;
  case CK_SATURN: o->N=113.6634+2.38980e-5*d;o->i=2.4886-1.081e-7*d;o->w=339.3939+2.97661e-5*d;o->a=9.55475;o->e=0.055546-9.499e-9*d;o->M=316.9670+0.0334442282*d;break;
  case CK_URANUS: o->N=74.0005+1.3978e-5*d;o->i=0.7733+1.9e-8*d;o->w=96.6612+3.0565e-5*d;o->a=19.18171-1.55e-8*d;o->e=0.047318+7.45e-9*d;o->M=142.5905+0.011725806*d;break;
  default:        o->N=131.7806+3.0173e-5*d;o->i=1.7700-2.55e-7*d;o->w=272.8461-6.027e-6*d;o->a=30.05826+3.313e-8*d;o->e=0.008606+2.15e-9*d;o->M=260.2471+0.005995147*d;break;
  }
}
static double kepler(double M,double e){
  M=ck_rev(M);
  double E=M+R2D*e*S_(M)*(1+e*C_(M));
  for(int k=0;k<6;k++)E=E-(E-R2D*e*S_(E)-M)/(1-e*C_(E));
  return E;
}
typedef struct { double r,v,xh,yh,zh; } hxyz;
static void helio(const elem*el,hxyz*o){
  double E=kepler(el->M,el->e);
  double xv=el->a*(C_(E)-el->e), yv=el->a*sqrt(1-el->e*el->e)*S_(E);
  o->r=hypot(xv,yv); o->v=at2(yv,xv);
  double vw=o->v+el->w;
  o->xh=o->r*(C_(el->N)*C_(vw)-S_(el->N)*S_(vw)*C_(el->i));
  o->yh=o->r*(S_(el->N)*C_(vw)+C_(el->N)*S_(vw)*C_(el->i));
  o->zh=o->r*(S_(vw)*S_(el->i));
}

void ck_sun_xy(double d,double*lon,double*xs,double*ys){
  elem s; get_elem(CK_SUN,d,&s); hxyz su; helio(&s,&su);
  double L=ck_rev(su.v+s.w);
  if(lon)*lon=L;
  if(xs)*xs=su.r*C_(L);
  if(ys)*ys=su.r*S_(L);
}
double ck_sun_lon(double d){double L;ck_sun_xy(d,&L,NULL,NULL);return L;}

double ck_moon_lon(double d){
  elem m,s; get_elem(CK_MOON,d,&m); get_elem(CK_SUN,d,&s);
  hxyz mm; helio(&m,&mm);
  double lon=at2(mm.yh,mm.xh);
  double Ls=ck_rev(s.w+s.M),Lm=ck_rev(m.N+m.w+m.M),Ms=ck_rev(s.M),Mm=ck_rev(m.M);
  double Dd=ck_rev(Lm-Ls),F=ck_rev(Lm-m.N);
  lon+=-1.274*S_(Mm-2*Dd)+0.658*S_(2*Dd)-0.186*S_(Ms)-0.059*S_(2*Mm-2*Dd)
       -0.057*S_(Mm-2*Dd+Ms)+0.053*S_(Mm+2*Dd)+0.046*S_(2*Dd-Ms)+0.041*S_(Mm-Ms)
       -0.035*S_(Dd)-0.031*S_(Mm+Ms)-0.015*S_(2*F-2*Dd)+0.011*S_(Mm-4*Dd);
  return ck_rev(lon);
}
double ck_moon_lat(double d){
  elem m,s; get_elem(CK_MOON,d,&m); get_elem(CK_SUN,d,&s);
  hxyz mm; helio(&m,&mm);
  double lat=R2D*asin(mm.zh/mm.r);
  double Lm=ck_rev(m.N+m.w+m.M),Mm=ck_rev(m.M),Ls=ck_rev(s.w+s.M);
  double Dd=ck_rev(Lm-Ls),F=ck_rev(Lm-m.N);
  lat+=-0.173*S_(F-2*Dd)-0.055*S_(Mm-F-2*Dd)-0.046*S_(Mm+F-2*Dd)
       +0.033*S_(F+2*Dd)+0.017*S_(2*Mm+F);
  return lat;
}
double ck_planet_lon(int body,double d){
  double xs,ys; ck_sun_xy(d,NULL,&xs,&ys);
  elem el; get_elem(body,d,&el); hxyz p; helio(&el,&p);
  return at2(p.yh+ys,p.xh+xs);
}
void ck_grahas(double d,double lon[CK_NBODY]){
  lon[CK_SUN]=ck_sun_lon(d); lon[CK_MOON]=ck_moon_lon(d);
  for(int b=CK_MERCURY;b<=CK_NEPTUNE;b++)lon[b]=ck_planet_lon(b,d);
  elem m; get_elem(CK_MOON,d,&m);
  lon[CK_RAHU]=ck_rev(m.N); lon[CK_KETU]=ck_rev(m.N+180);
}

double ck_obliq(double d){return 23.4393-3.563e-7*d;}
double ck_jd_of(double d){return d+2451543.5;}
double ck_gmst(double d){return ck_rev(280.46061837+360.98564736629*(ck_jd_of(d)-2451545.0));}
double ck_ayan(double y){return 23.853+0.0139552*(y-2000.0);}

double ck_ascendant(double d,double lat,double lonE){
  double ramc=ck_rev(ck_gmst(d)+lonE),e=ck_obliq(d);
  return at2(C_(ramc),-(S_(ramc)*C_(e)+T_(lat)*S_(e)));
}
double ck_mc(double d,double lonE){
  double e=ck_obliq(d),ramc=ck_rev(ck_gmst(d)+lonE);
  return at2(S_(ramc),C_(ramc)*C_(e));
}
void ck_altaz(double lonT,double beta,double d,double lat,double lonE,double*alt,double*az){
  double e=ck_obliq(d),ramc=ck_rev(ck_gmst(d)+lonE);
  double dec=asin(S_(beta)*C_(e)+C_(beta)*S_(e)*S_(lonT))*R2D;
  double ra=at2(S_(lonT)*C_(e)-T_(beta)*S_(e),C_(lonT));
  double H=ck_rev(ramc-ra);
  if(alt)*alt=asin(S_(lat)*S_(dec)+C_(lat)*C_(dec)*C_(H))*R2D;
  if(az)*az=ck_rev(at2(S_(H),C_(H)*S_(lat)-T_(dec)*C_(lat))+180);
}
void ck_telescope(double lonT,double beta,double d,double lat,double lonE,ck_horiz*o){
  double e=ck_obliq(d),ramc=ck_rev(ck_gmst(d)+lonE);
  o->dec=asin(S_(beta)*C_(e)+C_(beta)*S_(e)*S_(lonT))*R2D;
  o->ra=at2(S_(lonT)*C_(e)-T_(beta)*S_(e),C_(lonT)); o->raH=o->ra/15.0;
  o->ha=ck_rev(ramc-o->ra); o->haH=o->ha/15.0;
  o->alt=asin(S_(lat)*S_(o->dec)+C_(lat)*C_(o->dec)*C_(o->ha))*R2D;
  o->az=ck_rev(at2(S_(o->ha),C_(o->ha)*S_(lat)-T_(o->dec)*C_(lat))+180);
}
int ck_retro(int body,double d){
  double a=ck_planet_lon(body,d-0.5),b=ck_planet_lon(body,d+0.5);
  double dd=ck_rev(b-a); if(dd>180)dd-=360; return dd<0;
}

void ck_phase_info(double d,ck_phase*o){
  double sl=ck_sun_lon(d),ml=ck_moon_lon(d);
  o->elong=ck_rev(ml-sl); o->illum=(1-C_(o->elong))/2; o->waxing=o->elong<180;
  static const double lim[8]={11.25,78.75,101.25,168.75,191.25,258.75,281.25,348.75};
  static const int    nm [8]={0,1,2,3,4,5,6,7};
  o->name8=0;
  for(int k=0;k<8;k++){ if(o->elong<lim[k]){o->name8=nm[k];break;} }
}

const char *ck_karana_name(int kn){
  if(kn==0)return CK_KAR_FIX[0];
  if(kn>=57)return CK_KAR_FIX[kn-56];
  return CK_KAR_MOV[(kn-1)%7];
}
void ck_panchanga_calc(double d,double y,ck_panchanga*o){
  double sl=ck_sun_lon(d),ml=ck_moon_lon(d);
  double slS=ck_rev(sl-ck_ayan(y)),mlS=ck_rev(ml-ck_ayan(y));
  long v=(long)floor(d+2451543.5+1.5);
  o->vara_i=(int)(((v%7)+7)%7);
  double e=ck_rev(ml-sl);
  o->tithi_i=(int)floor(e/12.0); o->shukla=o->tithi_i<15;
  o->nak_i=(int)floor(mlS/(360.0/27.0));
  o->yoga_i=((int)floor(ck_rev(slS+mlS)/(360.0/27.0)))%27;
  o->karana_i=(int)floor(e/6.0);
  o->manzil_i=(int)floor(mlS/(360.0/28.0));
  o->moon_lat=ck_moon_lat(d);
}

double ck_elong_of(double t){return ck_rev(ck_moon_lon(t)-ck_sun_lon(t));}
double ck_solve_elong(double t0,double target){
  double t=t0;
  for(int i=0;i<12;i++){double de=ck_rev(target-ck_elong_of(t));if(de>180)de-=360;t+=de/12.19;}
  return t;
}
double ck_solve_asc(double t0,double target,double lat,double lonE){
  double st=4.0/1440.0, bestT=t0, bestE=999;
  double prev; {double x=ck_rev(ck_ascendant(t0-0.52,lat,lonE)-target); prev=x>180?x-360:x;}
  for(double t=t0-0.52+st;t<=t0+0.52;t+=st){
    double x=ck_rev(ck_ascendant(t,lat,lonE)-target); double c=x>180?x-360:x;
    if(prev<0&&c>=0&&c-prev<180){
      double lo=t-st,hi=t;
      for(int i=0;i<38;i++){double m=(lo+hi)/2;double fx=ck_rev(ck_ascendant(m,lat,lonE)-target);fx=fx>180?fx-360:fx;if(fx<0)lo=m;else hi=m;}
      double ts=(lo+hi)/2;
      double fe=ck_rev(ck_ascendant(ts,lat,lonE)-target);fe=fe>180?fe-360:fe;fe=fabs(fe);
      if(fabs(ts-t0)<fabs(bestT-t0)||bestE>0.02){bestT=ts;bestE=fe;}
    }
    prev=c;
  }
  return bestT;
}
/* generic sign-flip finder used by meshaDay/nowruzDay (JS findCross) */
static double find_cross(double(*fn)(double,void*),void*ctx,double a,double b){
  double fa; {double v=fn(a,ctx);fa=v>180?v-360:v;}
  for(double t=a+0.25;t<=b;t+=0.25){
    double v=fn(t,ctx),ft=v>180?v-360:v;
    if(fa<0&&ft>=0){a=t-0.25;b=t;break;} fa=ft;
  }
  for(int i=0;i<40;i++){double m=(a+b)/2,v=fn(m,ctx),fm=v>180?v-360:v;if(fm<0)a=m;else b=m;}
  return (a+b)/2;
}
static double f_mesha(double d,void*ctx){double Y=*(double*)ctx;return ck_rev(ck_sun_lon(d)-ck_ayan(Y));}
static double f_nowruz(double d,void*ctx){(void)ctx;return ck_sun_lon(d);}
double ck_dayno(int Y,int M,int D,double UT){
  return 367.0*Y-floor(7.0*(Y+floor((M+9)/12.0))/4.0)+floor(275.0*M/9.0)+D-730530.0+UT/24.0;
}
double ck_mesha_day(int Y){double y=Y;return find_cross(f_mesha,&y,ck_dayno(Y,4,3,0),ck_dayno(Y,4,26,0));}
double ck_nowruz_day(int Y){return find_cross(f_nowruz,NULL,ck_dayno(Y,3,15,0),ck_dayno(Y,3,26,0));}

int ck_eclipses(double dS,double dE,ck_ecl*out,int max){
  int n=0; double pn=1e9,pf=1e9,pd=0; int first=1;
  for(double d=dS;d<=dE;d+=0.5){
    double e=ck_rev(ck_moon_lon(d)-ck_sun_lon(d));
    double sn=e>180?e-360:e;
    double sf=fmod(e-180+540,360.0)-180;
    if(!first){
      if(pn<0&&sn>=0){
      /* solar-candidate crossing */
        double dd=pd+(d-pd)*(0-pn)/(sn-pn);
        double sl=ck_sun_lon(dd); elem m; get_elem(CK_MOON,dd,&m);
        double nd=ck_rev(m.N);
        double a1=fabs(fmod(ck_rev(sl)-ck_rev(nd),360.0)); if(a1>180)a1=360-a1;
        double a2=fabs(fmod(ck_rev(sl)-ck_rev(nd+180),360.0)); if(a2>180)a2=360-a2;
        double dist=a1<a2?a1:a2;
        if(dist<18.4&&n<max){out[n].d=dd;out[n].dist=dist;out[n].solar=1;out[n].central=dist<11.8;n++;}
      }
      if(pf<0&&sf>=0){
        double dd=pd+(d-pd)*(0-pf)/(sf-pf);
        double sl=ck_sun_lon(dd); elem m; get_elem(CK_MOON,dd,&m);
        double nd=ck_rev(m.N);
        double a1=fabs(fmod(ck_rev(sl)-ck_rev(nd),360.0)); if(a1>180)a1=360-a1;
        double a2=fabs(fmod(ck_rev(sl)-ck_rev(nd+180),360.0)); if(a2>180)a2=360-a2;
        double dist=a1<a2?a1:a2;
        if(dist<12.2&&n<max){out[n].d=dd;out[n].dist=dist;out[n].solar=0;out[n].central=dist<9.5;n++;}
      }
    }
    pn=sn;pf=sf;pd=d;first=0;
  }
  return n;
}

/* ── civil date helpers ──────────────────────────────────────────────── */
long ck_greg2jdn(int Y,int M,int D){
  long a=(14-M)/12, y=Y+4800L-a, m=M+12*a-3;
  return D+(153*m+2)/5+365*y+y/4-y/100+y/400-32045;
}
void ck_jdn2greg(long j,int*Y,int*M,int*D){
  long a=j+32044,b=(4*a+3)/146097,c=a-146097*b/4;
  long d2=(4*c+3)/1461,e=c-1461*d2/4,m=(5*e+2)/153;
  *Y=(int)(100*b+d2-4800+m/10); *M=(int)(m+3-12*(m/10)); *D=(int)(e-(153*m+2)/5+1);
}
long ck_jdn_of(double d){return (long)floor(d+2451543.5+0.5);}
void ck_d2date(double d,char out[20]){
  double jd=d+2451543.5;
  long z=(long)floor(jd+0.5),a=z;
  if(z>=2299161){long al=(long)floor((z-1867216.25)/36524.25);a=z+1+al-al/4;}
  long b=a+1524; long c=(long)floor((b-122.1)/365.25);
  long dd=(long)floor(365.25*c); long ee=(long)floor((b-dd)/30.6001);
  long day=b-dd-(long)floor(30.6001*ee);
  long mo=ee<14?ee-1:ee-13; long yr=mo>2?c-4716:c-4715;
  snprintf(out,16,"%ld-%02ld-%02ld",yr,mo,day);
}

/* ── calendars ───────────────────────────────────────────────────────── */
void ck_solar_hijri(double d,int Y,ck_ymd*o){
  double nz=ck_nowruz_day(Y); int y=Y-621;
  if(d<nz){nz=ck_nowruz_day(Y-1);y=Y-622;}
  long doy=(long)floor(d-nz); int m=0;
  static const int L[12]={31,31,31,31,31,31,30,30,30,30,30,30};
  while(m<11&&doy>=L[m]){doy-=L[m];m++;}
  o->y=y;o->mi=m+1;o->d=(int)doy+1;
}
void ck_samv_info(double d,int Y,ck_samv*o){
  int y=(d>=ck_mesha_day(Y))?Y:Y-1;
  o->samv_i=(((y-1987)%60)+60)%60; o->saka=y-78; o->vikrama=y+57; o->y=y;
}
void ck_greg2hijri(long jdn,ck_ymd*o){
  long l=jdn-1948440+10632; long n=(l-1)/10631; l=l-10631*n+354;
  long j=((10985-l)/5316)*((50*l)/17719)+(l/5670)*((43*l)/15238);
  l=l-((30-j)/15)*((17719*j)/50)-(j/16)*((15238*j)/43)+29;
  long im=(24*l)/709; long id=l-(709*im)/24; long iy=30*n+j-30;
  o->y=(int)iy;o->mi=(int)im;o->d=(int)id;
}
void ck_chinese_year(int Y,int*st,int*br){
  *st=(((Y-4)%10)+10)%10; *br=(((Y-4)%12)+12)%12;
}
void ck_mayan_calc(long jdn,ck_mayan*o){
  long n=jdn-584283;
  o->baktun=n>=0?n/144000:-(((-n)+143999)/144000);
  long r=((n%144000)+144000)%144000;
  o->katun=(int)(r/7200);r%=7200;o->tun=(int)(r/360);r%=360;
  o->uinal=(int)(r/20);o->kin=(int)(r%20);
  o->tz_num=(int)((((n+3)%13)+13)%13)+1;
  o->tz_name_i=(int)((((n+19)%20)+20)%20);
  long hp=(((n+348)%365)+365)%365;
  o->haab_day=(int)(hp%20); o->haab_mo_i=(int)(hp/20);
}
int ck_astro_age(double y){return (int)floor(ck_rev(-ck_ayan(y))/30.0);}

/* Hebrew fixed arithmetic (epoch offset 347999, calibrated) */
static int heb_leap(long y){return ((7*y+1)%19)<7;}
static long heb_elapsed(long y){
  long m=(235*y-234)/19;
  long long p=12084LL+13753LL*(long long)m;
  long d=m*29+(long)(p/25920);
  if((3*(d+1))%7<3)d++;
  return d;
}
static long heb_ny(long y){
  long c=heb_elapsed(y),l=heb_elapsed(y-1),n=heb_elapsed(y+1);
  long corr=0; if(n-c==356)corr=2; else if(c-l==382)corr=1;
  return c+corr;
}
static int heb_month_len(long y,int leap,int i){
  long yl=heb_ny(y+1)-heb_ny(y);
  /* month order: 12mo Tishri,Cheshvan,Kislev,Tevet,Shevat,Adar,Nisan,Iyar,Sivan,Tammuz,Av,Elul
     13mo inserts Adar I(30)/Adar II(29) at 5/6 shifting the rest */
  int ci=leap?( i==1?1 : i==2?2 : i==3?3 : i==6?100 /*Adar II*/ : (i==8||i==10||i==12)?29 : -1 ):0;
  (void)ci;
  if(!leap){
    if(i==1)return (yl==355||yl==385)?30:29;          /* Cheshvan */
    if(i==2)return (yl==353||yl==383)?29:30;          /* Kislev   */
    if(i==3||i==5||i==7||i==9||i==11)return 29;       /* Tevet,Adar,Iyar,Tammuz,Elul */
    return 30;
  } else {
    if(i==1)return (yl==355||yl==385)?30:29;          /* Cheshvan */
    if(i==2)return (yl==353||yl==383)?29:30;          /* Kislev   */
    if(i==3||i==6||i==8||i==10||i==12)return 29;      /* Tevet,Adar II,Iyar,Tammuz,Elul */
    return 30;                                        /* incl. Adar I */
  }
}
#define HEB_OFF 347999L
void ck_hebrew(long jdn,ck_heb*o){
  long eDay=jdn-HEB_OFF+1;
  long y=(long)floor(eDay/365.2468)+1;
  while(heb_ny(y+1)<=eDay)y++;
  while(heb_ny(y)>eDay)y--;
  long day=eDay-heb_ny(y)+1;
  int leap=heb_leap(y),nmo=leap?13:12,i=0;
  while(i<nmo){int dl=heb_month_len(y,leap,i);if(day<=dl)break;day-=dl;i++;}
  o->y=(int)y;o->month_i=i;o->d=(int)day;o->leap=leap;
}
const char *ck_heb_month_name(const ck_heb*h){
  return h->leap?CK_HEB_M13[h->month_i]:CK_HEB_M12[h->month_i];
}

void ck_nanakshahi(long jdn,ck_nanak*o){
  int Y,M,D; ck_jdn2greg(jdn,&Y,&M,&D);
  long ny=ck_greg2jdn(Y,3,14); int yr=Y;
  if(jdn<ny){ny=ck_greg2jdn(Y-1,3,14);yr=Y-1;}
  int nanYear=yr-1468; long doy=jdn-ny; int gy=yr+1;
  int leap=((gy%4==0&&gy%100!=0)||gy%400==0);
  int len[12]={31,31,31,31,31,30,30,30,30,30,30,30};
  if(leap)len[11]=31;
  int m=0; while(m<11&&doy>=len[m]){doy-=len[m];m++;}
  o->y=nanYear;o->month_i=m;o->d=(int)doy+1;
}

static const int LEAP_SUNNI[11]={2,5,7,10,13,16,18,21,24,26,29};
static const int LEAP_SHIA [11]={2,5,8,10,13,16,19,21,24,27,29};
static int in_leap_set(const int*set,int v){for(int k=0;k<11;k++)if(set[k]==v)return 1;return 0;}
void ck_hijri_tabular(long jdn,int shia,ck_ymd*o){
  const int*set=shia?LEAP_SHIA:LEAP_SUNNI;
  long epoch=1948440,n=jdn-epoch,cyc=10631;
  long c=n>=0?n/cyc:-(((-n)+cyc-1)/cyc);
  n-=c*cyc; long year=30*c;
  for(;;){int yy=(int)((((year+1-1)%30)+30)%30)+1;
    int l=354+(in_leap_set(set,yy)?1:0);
    if(n<l)break;
    n-=l; year++;}
  year++;
  int mo=1;
  for(;mo<12;mo++){
    int l=(mo%2==1)?30:(mo==12&&in_leap_set(set,(int)((((year-1)%30)+30)%30)+1)?30:29);
    if(n<l)break;
    n-=l;
  }
  o->y=(int)year;o->mi=mo;o->d=(int)n+1;
}

/* ── jyotiṣa ─────────────────────────────────────────────────────────── */
void ck_build_chart(double d,double y,double lat,double lon,ck_chart*o){
  double g[CK_NBODY]; ck_grahas(d,g);
  o->asc=ck_rev(ck_ascendant(d,lat,lon)-ck_ayan(y));
  static const int map[9]={CK_SUN,CK_MOON,CK_MARS,CK_MERCURY,CK_JUPITER,CK_VENUS,CK_SATURN,CK_RAHU,CK_KETU};
  for(int i=0;i<9;i++)o->pos[i]=ck_rev(g[map[i]]-ck_ayan(y));
  o->asc_sign=(int)floor(o->asc/30.0);
}
static int sgn_of(double v){return (int)floor(v/30.0);}
unsigned ck_yogas(const ck_chart*ch,int*ss_phase){
  unsigned out=0;
  double rahu=ch->pos[CKC_RAHU];
  int seven[7]={CKC_SUN,CKC_MOON,CKC_MARS,CKC_MERCURY,CKC_JUPITER,CKC_VENUS,CKC_SATURN};
  int h1=1,h2=1;
  for(int k=0;k<7;k++){
    double a=ck_rev(ch->pos[seven[k]]-rahu);
    if(!(a>=0&&a<=180))h1=0;
    if(!(a>=180||a<=0.0001))h2=0;
  }
  if(h1||h2)out|=CK_Y_KALASARPA;

  int marsS=sgn_of(ch->pos[CKC_MARS]);
  int marsH=((marsS-ch->asc_sign+12)%12)+1;
  int fromMoon=((marsS-sgn_of(ch->pos[CKC_MOON])+12)%12)+1;
  int fromVen =((marsS-sgn_of(ch->pos[CKC_VENUS])+12)%12)+1;
  int dosB[6]={1,2,4,7,8,12};
  int mL=0,mC=0,mV=0;
  for(int k=0;k<6;k++){if(marsH==dosB[k])mL=1;if(fromMoon==dosB[k])mC=1;if(fromVen==dosB[k])mV=1;}
  if(mL)out|=CK_Y_MANGLIK_L;
  if(mC)out|=CK_Y_MANGLIK_C;
  if(mV)out|=CK_Y_MANGLIK_V;
  int jFromMoon=((sgn_of(ch->pos[CKC_JUPITER])-sgn_of(ch->pos[CKC_MOON])+12)%12)+1;
  if(jFromMoon==1||jFromMoon==4||jFromMoon==7||jFromMoon==10)out|=CK_Y_GAJAKESARI;
  int m=sgn_of(ch->pos[CKC_MOON]),s2=(m+1)%12,s12=(m+11)%12;
  int oth[5]={CKC_MARS,CKC_MERCURY,CKC_JUPITER,CKC_VENUS,CKC_SATURN};
  int in2=0,in12=0;
  for(int k=0;k<5;k++){int s=sgn_of(ch->pos[oth[k]]);if(s==s2)in2=1;if(s==s12)in12=1;}
  if(in2&&in12)out|=CK_Y_DURUDHARA;
  else if(in2)out|=CK_Y_SUNAPHA;
  else if(in12)out|=CK_Y_ANAPHA;
  else out|=CK_Y_KEMADRUMA;
  /* mahāpuruṣa: dignified (own or exalt) in a kendra from Lagna */
  static const int own[5][2]={{0,7},{2,5},{8,11},{1,6},{9,10}};  /* Mars,Merc,Jup,Ven,Sat */
  static const int exal[5]={9,5,3,11,6};
  static const unsigned mpb[5]={CK_Y_MPP_RUCHAKA,CK_Y_MPP_BHADRA,CK_Y_MPP_HAMSA,CK_Y_MPP_MALAVYA,CK_Y_MPP_SHASHA};
  static const int mpp[5]={CKC_MARS,CKC_MERCURY,CKC_JUPITER,CKC_VENUS,CKC_SATURN};
  for(int k=0;k<5;k++){
    int s=sgn_of(ch->pos[mpp[k]]);
    int h=((s-ch->asc_sign+12)%12)+1;
    int dign=(s==own[k][0]||s==own[k][1]||s==exal[k]);
    if(dign&&(h==1||h==4||h==7||h==10))out|=mpb[k];
  }
  int dS=((sgn_of(ch->pos[CKC_SATURN])-sgn_of(ch->pos[CKC_MOON])+12)%12);
  if(dS==11||dS==0||dS==1){out|=CK_Y_SADESATI;if(ss_phase)*ss_phase=(dS==11?0:dS==0?1:2);}
  else if(ss_phase)*ss_phase=-1;
  return out;
}

static const double VIM_Y[9]={7,20,6,10,7,18,16,19,17};
void ck_vimshottari(double moonSid,double birthYear,ck_vims*o){
  double span=360.0/27.0;
  o->nak=(int)floor(moonSid/span);
  int lordIdx=o->nak%9; o->lord0=lordIdx;
  double frac=(moonSid-o->nak*span)/span;
  double elapsed=frac*VIM_Y[lordIdx];
  o->balance=VIM_Y[lordIdx]-elapsed;
  double t=birthYear-elapsed;
  for(int i=0;i<9;i++){
    int L=(lordIdx+i)%9;
    o->lords[i]=L;o->start[i]=t;o->years[i]=VIM_Y[L];t+=VIM_Y[L];
  }
}

/* ── annual events (parity port) ─────────────────────────────────────── */
typedef struct { ck_event e; int idx; } ev_slot;
static void gs(long j,char out[12]){int Y,M,D;ck_jdn2greg(j,&Y,&M,&D);snprintf(out,12,"%d-%02d-%02d",Y,M,D);}
static double dOf(long j){int Y,M,D;ck_jdn2greg(j,&Y,&M,&D);return ck_dayno(Y,M,D,12);}

/* geometric sunset (alt = -0.833° descending), UT day-number; Ujjain drives the pradoṣa rule */
double ck_sunset_ut(long jdn,double lat,double lonE){
  int Y,M,D; ck_jdn2greg(jdn,&Y,&M,&D);
  double t=ck_dayno(Y,M,D,18.0-lonE/15.0);
  double lo=t-0.14,hi=t+0.14,alt,az;
  ck_altaz(ck_sun_lon(lo),0,lo,lat,lonE,&alt,&az); double aLo=alt+0.833;
  ck_altaz(ck_sun_lon(hi),0,hi,lat,lonE,&alt,&az); double aHi=alt+0.833;
  if(!(aLo>0&&aHi<0)){lo=t-0.3;hi=t+0.3;
    ck_altaz(ck_sun_lon(lo),0,lo,lat,lonE,&alt,&az); aLo=alt+0.833;
    ck_altaz(ck_sun_lon(hi),0,hi,lat,lonE,&alt,&az); aHi=alt+0.833;}
  if(!(aLo>0&&aHi<0))return t;
  for(int i=0;i<34;i++){double m=(lo+hi)/2;
    ck_altaz(ck_sun_lon(m),0,m,lat,lonE,&alt,&az);
    if(alt+0.833>0)lo=m;else hi=m;}
  return (lo+hi)/2;
}
static void push_ev(ev_slot*ev,int*n,int max,long j,const char*date,
                    const char*name,const char*trad,const char*note){
  if(*n>=max)return;
  ck_event*e=&ev[*n].e;
  if(date)snprintf(e->date,sizeof e->date,"%s",date);
  else gs(j,e->date);
  snprintf(e->name,sizeof e->name,"%s",name);
  snprintf(e->trad,sizeof e->trad,"%s",trad);
  snprintf(e->note,sizeof e->note,"%s",note?note:"");
  ev[*n].idx=*n;(*n)++;
}
static double tithi_day_after(double dFull,int tIdx,int maxDays){
  for(int k=1;k<=maxDays;k++){
    double d=dFull+k,e=ck_rev(ck_moon_lon(d)-ck_sun_lon(d));
    if((int)floor(e/12.0)==tIdx)return d;
  }
  return -1e18;
}
int ck_annual_events(int Y,ck_event*out,int max){
  enum{CAP=140};
  static ev_slot ev[CAP]; int n=0;
  long jd0=ck_greg2jdn(Y,1,1),jd1=ck_greg2jdn(Y,12,31);
  char buf[96];

  /* Jewish */
  for(long j=jd0;j<=jd1;j++){
    ck_heb h; ck_hebrew(j,&h); const char*mn=ck_heb_month_name(&h);
    if(!strcmp(mn,"Tishri")&&h.d==1){snprintf(buf,sizeof buf,"Rosh Hashana (%d AM)",h.y);push_ev(ev,&n,CAP,j,NULL,buf,"Jewish","begins previous sunset");}
    if(!strcmp(mn,"Tishri")&&h.d==10)push_ev(ev,&n,CAP,j,NULL,"Yom Kippur","Jewish","");
    if(!strcmp(mn,"Tishri")&&h.d==15)push_ev(ev,&n,CAP,j,NULL,"Sukkot begins","Jewish","");
    if(!strcmp(mn,"Nisan")&&h.d==15)push_ev(ev,&n,CAP,j,NULL,"Pesach begins","Jewish","");
    if(!strcmp(mn,"Sivan")&&h.d==6)push_ev(ev,&n,CAP,j,NULL,"Shavuot","Jewish","");
    if(!strcmp(mn,"Kislev")&&h.d==25)push_ev(ev,&n,CAP,j,NULL,"Hanukkah begins","Jewish","");
  }
  /* Islamic — both tabular reckonings */
  for(int pass=0;pass<2;pass++){
    int shia=pass; const char*note=shia?"Shia tabular":"Sunni tabular";
    for(long j=jd0;j<=jd1;j++){
      ck_ymd q; ck_hijri_tabular(j,shia,&q);
      if(q.mi==1&&q.d==1){snprintf(buf,sizeof buf,"Islamic New Year %d AH",q.y);push_ev(ev,&n,CAP,j,NULL,buf,"Islamic",note);}
      if(q.mi==1&&q.d==10)push_ev(ev,&n,CAP,j,NULL,"ʿĀshūrā (10 Muḥarram)","Islamic",note);
      if(q.mi==2&&q.d==20&&shia)push_ev(ev,&n,CAP,j,NULL,"Arbaʿīn (20 Ṣafar)","Islamic","Shia tabular");
      if(q.mi==3&&q.d==12&&!shia)push_ev(ev,&n,CAP,j,NULL,"Mawlid an-Nabī (12 Rabīʿ I)","Islamic","Sunni tabular");
      if(q.mi==3&&q.d==17&&shia)push_ev(ev,&n,CAP,j,NULL,"Mawlid / Mīlād (17 Rabīʿ I)","Islamic","Shia tabular");
      if(q.mi==9&&q.d==1)push_ev(ev,&n,CAP,j,NULL,"Ramaḍān begins","Islamic",note);
      if(q.mi==10&&q.d==1)push_ev(ev,&n,CAP,j,NULL,"Eid al-Fiṭr","Islamic",note);
      if(q.mi==12&&q.d==10)push_ev(ev,&n,CAP,j,NULL,"Eid al-Aḍḥā","Islamic",note);
    }
  }
  /* Sikh fixed */
  {char dt[12];snprintf(dt,sizeof dt,"%d-03-14",Y);
   snprintf(buf,sizeof buf,"Nanakshahi New Year · 1 Chet %d",Y-1468);
   push_ev(ev,&n,CAP,0,dt,buf,"Sikh","");
   snprintf(dt,sizeof dt,"%d-04-14",Y);
   push_ev(ev,&n,CAP,0,dt,"Vaisakhi · 1 Vaisakh","Sikh","");}
  /* saṅkrāntis */
  {int prev=(int)floor(ck_rev(ck_sun_lon(dOf(jd0-1))-ck_ayan(Y))/30.0);
   for(long j=jd0;j<=jd1;j++){
     int sg=(int)floor(ck_rev(ck_sun_lon(dOf(j))-ck_ayan(Y))/30.0);
     if(sg!=prev){
       char note2[64];snprintf(note2,sizeof note2,"Sun enters sidereal %s",CK_SNAME[sg]);
       snprintf(buf,sizeof buf,"%s Saṅkrānti%s",CK_SNAME[sg],
                sg==9?" (Makara — Uttarāyaṇa)":(sg==0?" (solar new year)":""));
       push_ev(ev,&n,CAP,j,NULL,buf,"Hindu",note2);
       prev=sg;}
   }}
  /* Hindu luni-solar — amānta saṅkrānti rule */
  {
    double nms[20]; int nn=0;
    double dnm=ck_solve_elong(dOf(jd0)-45,0);
    while(dnm<=dOf(jd1)+40&&nn<20){nms[nn++]=dnm;dnm=ck_solve_elong(dnm+29.5,0);}
    for(int i=0;i+1<nn;i++){
      double a=nms[i],b=nms[i+1];
      int s0=(int)floor(ck_rev(ck_sun_lon(a+0.3)-ck_ayan(Y))/30.0);
      int s1=(int)floor(ck_rev(ck_sun_lon(b-0.3)-ck_ayan(Y))/30.0);
      int adhika=(s0==s1);
      int nameIdx=adhika?(s0+1)%12:s1;
      const char*MN=CK_AMONTH[nameIdx];
      double F=ck_solve_elong((a+b)/2,180);
      double lo=dOf(jd0)-0.6,hi=dOf(jd1)+0.6;
#define INY(x) ((x)>=lo&&(x)<=hi)
      if(adhika){
        if(INY(F)){snprintf(buf,sizeof buf,"Adhika %s pūrṇimā",MN);
          push_ev(ev,&n,CAP,ck_jdn_of(F),NULL,buf,"Hindu","intercalary month — no festivals");}
        continue;
      }
      if(nameIdx==11&&INY(F))push_ev(ev,&n,CAP,ck_jdn_of(F),NULL,"Holikā Dahana / Holi pūrṇimā","Hindu","Phālguna pūrṇimā · Holi next day");
      if(nameIdx==1&&INY(F))push_ev(ev,&n,CAP,ck_jdn_of(F),NULL,"Buddha Pūrṇimā","Hindu/Buddhist","Vaiśākha pūrṇimā");
      if(nameIdx==3&&INY(F))push_ev(ev,&n,CAP,ck_jdn_of(F),NULL,"Guru Pūrṇimā","Hindu","Āṣāḍha pūrṇimā");
      if(nameIdx==4){
        if(INY(F))push_ev(ev,&n,CAP,ck_jdn_of(F),NULL,"Rakṣā Bandhana","Hindu","Śrāvaṇa pūrṇimā");
        double jan=tithi_day_after(F,22,12);
        if(jan>-1e17&&INY(jan))push_ev(ev,&n,CAP,ck_jdn_of(jan),NULL,"Kṛṣṇa Janmāṣṭamī","Hindu","Śrāvaṇa kṛṣṇa aṣṭamī (amānta)");
      }
      if(nameIdx==6){
        double nv=tithi_day_after(a,0,4);
        if(nv>-1e17&&INY(nv))push_ev(ev,&n,CAP,ck_jdn_of(nv),NULL,"Śāradīya Navarātri begins","Hindu","Āśvina śukla pratipadā");
        double vj=tithi_day_after(a,9,14);
        if(vj>-1e17&&INY(vj))push_ev(ev,&n,CAP,ck_jdn_of(vj),NULL,"Vijayadaśamī (Daśahrā)","Hindu","Āśvina śukla daśamī");
        {double tS=ck_solve_elong(b-1.2,348);long dv=ck_jdn_of(b);long cd[2];cd[0]=ck_jdn_of(b)-1;cd[1]=ck_jdn_of(b);
          for(int qi=0;qi<2;qi++){double ss=ck_sunset_ut(cd[qi],23.1793,75.7849);if(ss>=tS&&ss<=b)dv=cd[qi];}
          if(INY(dOf(dv)))push_ev(ev,&n,CAP,dv,NULL,"Dīpāvalī (Lakṣmī Pūjā)","Hindu","Āśvina amāvāsyā (amānta) · pradoṣa-vyāpinī @ Ujjain");}
      }
      if(nameIdx==7&&INY(F))push_ev(ev,&n,CAP,ck_jdn_of(F),NULL,"Kārtika Pūrṇimā · Guru Nanak Gurpurab","Hindu/Sikh","");
      if(nameIdx==0){
        double ug=tithi_day_after(a,0,4);
        if(ug>-1e17&&INY(ug))push_ev(ev,&n,CAP,ck_jdn_of(ug),NULL,"Ugadi / Gudi Padwa (luni-solar new year)","Hindu","Caitra śukla pratipadā");
        double rn=tithi_day_after(a,8,13);
        if(rn>-1e17&&INY(rn))push_ev(ev,&n,CAP,ck_jdn_of(rn),NULL,"Rāma Navamī","Hindu","Caitra śukla navamī");
      }
      if(nameIdx==10){
        double shv=tithi_day_after(F,28,16);
        if(shv>-1e17&&INY(shv))push_ev(ev,&n,CAP,ck_jdn_of(shv),NULL,"Mahāśivarātri","Hindu","Māgha kṛṣṇa caturdaśī (amānta)");
      }
#undef INY
    }
  }
  /* eclipses of the year */
  {ck_ecl ec[12];int ne=ck_eclipses(dOf(jd0),dOf(jd1),ec,12);
   for(int k=0;k<ne;k++){
     char note2[64];snprintf(note2,sizeof note2,"Sun–node %.1f°",ec[k].dist);
     snprintf(buf,sizeof buf,"%s eclipse%s",ec[k].solar?"Solar":"Lunar",
              ec[k].central?" (central/total possible)":" (partial)");
     push_ev(ev,&n,CAP,ck_jdn_of(ec[k].d),NULL,buf,"Astronomical",note2);
   }}
  /* stable sort by date (insertion order preserved on ties — matches V8) */
  for(int i=1;i<n;i++){
    ev_slot key=ev[i];int j2=i-1;
    while(j2>=0&&(strcmp(ev[j2].e.date,key.e.date)>0||
          (strcmp(ev[j2].e.date,key.e.date)==0&&ev[j2].idx>key.idx))){ev[j2+1]=ev[j2];j2--;}
    ev[j2+1]=key;
  }
  int w=n<max?n:max;
  for(int i=0;i<w;i++)out[i]=ev[i].e;
  return w;
}
