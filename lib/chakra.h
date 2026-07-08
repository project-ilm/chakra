/*
 * chakra.h — CHAKRA Temporal Cycle Observatory: C99 computation library.
 * A faithful port of src/chakra-core.js (same algorithms, same constants),
 * verified bit-for-practical-bit against the JS reference by test_chakra.c
 * using vectors generated from the JS core itself (make vectors && make test).
 *
 * Ephemeris (Schlyter) · Lahiri ayanāṁśa · multi-tradition calendars ·
 * pañcāṅga · jyotiṣa yogas & Vimśottarī daśā · telescope coordinates ·
 * computed annual festival engine (amānta rule, adhika-māsa aware).
 *
 * Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version. Distributed WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See <https://www.gnu.org/licenses/>.
 *
 * DISCLAIMER: low-precision ephemeris — for study, teaching and cultural
 * computation, NOT for navigation, muhūrta-critical, or safety-critical use.
 * Astrological outputs are cultural/heritage computations, not predictions.
 *
 * Design notes:
 *   - C99, no dependencies beyond libm (-lm). No heap allocation anywhere:
 *     every function writes into caller-supplied buffers/structs.
 *   - All angles in degrees, all times in the app "day number" d
 *     (days from 2000 Jan 0.0 UT; JD = d + 2451543.5) unless stated.
 *   - Strings are UTF-8 byte sequences, byte-identical to the JS core's output.
 */
#ifndef CHAKRA_H
#define CHAKRA_H

#ifdef __cplusplus
extern "C" {
#endif

#define CK_VERSION "1.4.1"

/* ── body indices (order identical to the JS grahas() object) ─────────── */
enum {
  CK_SUN = 0, CK_MOON, CK_MERCURY, CK_VENUS, CK_MARS,
  CK_JUPITER, CK_SATURN, CK_URANUS, CK_NEPTUNE, CK_RAHU, CK_KETU,
  CK_NBODY /* = 11 */
};
extern const char *CK_BODY_NAME[CK_NBODY];

/* ── name tables (UTF-8; indices match the JS core) ───────────────────── */
extern const char *CK_RASHI[12];      /* Meṣa … Mīna                      */
extern const char *CK_SIGNS_EN[12];   /* Aries … Pisces                   */
extern const char *CK_NAK[27];
extern const char *CK_VARA[7];
extern const char *CK_TITHI[15];
extern const char *CK_YOGA_N[27];
extern const char *CK_KAR_MOV[7];
extern const char *CK_KAR_FIX[4];     /* Kiṃstughna, Śakuni, Chatuṣpāda, Nāga */
extern const char *CK_MANAZIL[28];
extern const char *CK_SAMV[60];
extern const char *CK_HIJRI_M[12];
extern const char *CK_SH_M[12];       /* Solar Hijrī month names          */
extern const char *CK_HEB_M12[12];
extern const char *CK_HEB_M13[13];
extern const char *CK_NANAK_M[12];
extern const char *CK_TZ_NAMES[20];
extern const char *CK_HAAB_NAMES[19];
extern const char *CK_STEM[10];
extern const char *CK_ANIM[12];
extern const char *CK_SNAME[12];      /* saṅkrānti / sidereal sign names  */
extern const char *CK_AMONTH[12];     /* Caitra … Phālguna (amānta)       */

/* ── angle & time primitives ──────────────────────────────────────────── */
double ck_rev(double x);                                   /* [0,360)     */
double ck_dayno(int Y, int M, int D, double UT_hours);     /* app d       */
double ck_jd_of(double d);                                 /* JD          */
long   ck_greg2jdn(int Y, int M, int D);                   /* civil JDN   */
void   ck_jdn2greg(long jdn, int *Y, int *M, int *D);
long   ck_jdn_of(double d);                                /* d → civil JDN */
void   ck_d2date(double d, char out[20]);                  /* "YYYY-MM-DD" */

/* ── ephemeris ────────────────────────────────────────────────────────── */
double ck_sun_lon(double d);                 /* geocentric tropical λ☉    */
void   ck_sun_xy(double d, double *lon, double *xs, double *ys);
double ck_moon_lon(double d);                /* perturbed λ☾              */
double ck_moon_lat(double d);                /* perturbed β☾              */
double ck_planet_lon(int body, double d);    /* CK_MERCURY..CK_NEPTUNE    */
void   ck_grahas(double d, double lon[CK_NBODY]);
double ck_obliq(double d);
double ck_gmst(double d);                    /* degrees                   */
double ck_ayan(double y);                    /* Lahiri, decimal year      */
double ck_ascendant(double d, double lat, double lonE);
double ck_mc(double d, double lonE);
void   ck_altaz(double lonT, double beta, double d,
                double lat, double lonE, double *alt, double *az);
int    ck_retro(int body, double d);         /* 1 if retrograde           */

typedef struct { double ra, raH, dec, alt, az, ha, haH; } ck_horiz;
void   ck_telescope(double lonT, double beta, double d,
                    double lat, double lonE, ck_horiz *out);

/* ── moon phase & pañcāṅga ────────────────────────────────────────────── */
typedef struct {
  double elong, illum;
  int    waxing;      /* 1 while e<180                                    */
  int    name8;       /* 0..7 into the eight canonical phase names        */
} ck_phase;
void ck_phase_info(double d, ck_phase *out);
extern const char *CK_PHASE8[8];

typedef struct {
  int    vara_i;        /* 0=Ravivāra … 6=Śanivāra                        */
  int    tithi_i;       /* 0..29 (index into 30 tithis)                   */
  int    shukla;        /* 1 = śukla pakṣa                                */
  int    nak_i;         /* 0..26 (sidereal)                               */
  int    yoga_i;        /* 0..26                                          */
  int    karana_i;      /* 0..59 half-tithi index; use ck_karana_name()   */
  int    manzil_i;      /* 0..27 (sidereal lunar mansion)                 */
  double moon_lat;
} ck_panchanga;
void        ck_panchanga_calc(double d, double y, ck_panchanga *out);
const char *ck_karana_name(int karana_i);

/* ── solvers ──────────────────────────────────────────────────────────── */
double ck_sunset_ut(long jdn,double lat,double lonE);   /* geometric sunset, UT */
double ck_elong_of(double t);
double ck_solve_elong(double t0, double target);            /* 12 Newton  */
double ck_solve_asc(double t0, double target, double lat, double lonE);
double ck_mesha_day(int Y);                                  /* d of Meṣa saṅkrānti */
double ck_nowruz_day(int Y);

/* ── eclipses ─────────────────────────────────────────────────────────── */
typedef struct { double d, dist; int solar, central; } ck_ecl;
int ck_eclipses(double dS, double dE, ck_ecl *out, int max); /* count      */

/* ── calendars ────────────────────────────────────────────────────────── */
typedef struct { int y, mi, d; } ck_ymd;          /* mi is 1-based month   */
void ck_solar_hijri(double d, int gregY, ck_ymd *out);
typedef struct { int samv_i, saka, vikrama, y; } ck_samv;
void ck_samv_info(double d, int gregY, ck_samv *out);
void ck_greg2hijri(long jdn, ck_ymd *out);        /* Kuwaiti tabular       */
void ck_hijri_tabular(long jdn, int shia, ck_ymd *out);
typedef struct { int y, month_i, d, leap; } ck_heb;
void ck_hebrew(long jdn, ck_heb *out);
const char *ck_heb_month_name(const ck_heb *h);
typedef struct { int y, month_i, d; } ck_nanak;
void ck_nanakshahi(long jdn, ck_nanak *out);
void ck_chinese_year(int Y, int *stem_i, int *branch_i);
typedef struct { long baktun; int katun, tun, uinal, kin;
                 int tz_num, tz_name_i, haab_day, haab_mo_i; } ck_mayan;
void ck_mayan_calc(long jdn, ck_mayan *out);
int  ck_astro_age(double y);                       /* index into SIGNS_EN  */

/* ── jyotiṣa: chart, yogas, daśā ─────────────────────────────────────── */
typedef struct {
  double asc;                 /* sidereal ascendant                        */
  double pos[9];              /* Sun,Moon,Mars,Mercury,Jupiter,Venus,      */
                              /* Saturn,Rahu,Ketu — sidereal (JS order)    */
  int    asc_sign;
} ck_chart;
enum { CKC_SUN=0, CKC_MOON, CKC_MARS, CKC_MERCURY, CKC_JUPITER,
       CKC_VENUS, CKC_SATURN, CKC_RAHU, CKC_KETU };
void ck_build_chart(double d, double y, double lat, double lon, ck_chart *out);

#define CK_Y_KALASARPA   (1u<<0)
#define CK_Y_MANGLIK_L   (1u<<1)   /* from Lagna   */
#define CK_Y_MANGLIK_C   (1u<<2)   /* from Chandra */
#define CK_Y_MANGLIK_V   (1u<<3)   /* from Śukra   */
#define CK_Y_GAJAKESARI  (1u<<4)
#define CK_Y_SUNAPHA     (1u<<5)
#define CK_Y_ANAPHA      (1u<<6)
#define CK_Y_DURUDHARA   (1u<<7)
#define CK_Y_KEMADRUMA   (1u<<8)
#define CK_Y_MPP_RUCHAKA (1u<<9)   /* Mars    */
#define CK_Y_MPP_BHADRA  (1u<<10)  /* Mercury */
#define CK_Y_MPP_HAMSA   (1u<<11)  /* Jupiter */
#define CK_Y_MPP_MALAVYA (1u<<12)  /* Venus   */
#define CK_Y_MPP_SHASHA  (1u<<13)  /* Saturn  */
#define CK_Y_SADESATI    (1u<<14)
unsigned ck_yogas(const ck_chart *ch, int *sadesati_phase /* 0 rising,1 peak,2 setting; may be NULL */);

typedef struct {
  int    nak;          /* 0..26                                            */
  int    lord0;        /* index into CK_VIM_LORDS of the birth lord        */
  double balance;      /* years remaining of the first mahādaśā            */
  double start[9], years[9];
  int    lords[9];     /* indices into CK_VIM_LORDS                        */
} ck_vims;
extern const char *CK_VIM_LORDS[9];
void ck_vimshottari(double moon_sid, double birth_year, ck_vims *out);

/* ── computed annual events (parity with JS annualEvents) ────────────── */
typedef struct {
  char date[12];       /* "YYYY-MM-DD"                                     */
  char name[96];       /* UTF-8                                            */
  char trad[28];
  char note[112];
} ck_event;
int ck_annual_events(int Y, ck_event *out, int max);   /* count written    */

#ifdef __cplusplus
}
#endif
#endif /* CHAKRA_H */
