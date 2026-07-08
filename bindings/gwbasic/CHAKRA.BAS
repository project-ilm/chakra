10 REM ============================================================
20 REM  CHAKRA.BAS - CHAKRA Temporal Cycle Observatory, GW-BASIC port
30 REM  Panchanga core: JDN, Sun & Moon longitude, tithi, nakshatra,
40 REM  vara, Lahiri ayanamsa, tabular Hijri. Line-numbered, runs in
50 REM  GW-BASIC 3.23 / PC-BASIC / DOSBox. Single-precision safe.
60 REM
70 REM  Ported from src/chakra-core.js (the reference implementation).
80 REM  Each GOSUB maps to a JS function - see README in this folder.
90 REM
100 REM  Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
110 REM  SPDX-License-Identifier: GPL-3.0-or-later. No warranty.
120 REM ============================================================
130 REM
140 DEFDBL A-H, O-Z : REM double where GW-BASIC allows, for angle work
150 PI# = 3.14159265358979#
160 DR# = PI# / 180#
170 REM
180 REM ---- masthead ----
190 CLS
200 PRINT "==================================================="
210 PRINT " CHAKRA - Panchanga (GW-BASIC port of chakra-core)"
220 PRINT " One sky, many calendars - computed, not looked up."
230 PRINT "==================================================="
240 PRINT
250 REM
260 REM ---- input the moment ----
270 INPUT "Year  (e.g. 2026)   : ", YR
280 INPUT "Month (1-12)        : ", MO
290 INPUT "Day   (1-31)        : ", DY
300 INPUT "Hour  UT (0-23.99)  : ", UT#
310 PRINT
320 REM
330 REM ---- day number from J2000.0, and JDN ----
340 GOSUB 2000 : REM -> DN# (days from 2000-01-01 12:00), JD#
350 REM
360 REM ---- solar & lunar longitude ----
370 GOSUB 2500 : REM -> SLON# (Sun ecl. longitude, deg 0..360)
380 GOSUB 3000 : REM -> MLON# (Moon ecl. longitude, deg 0..360)
390 REM
400 REM ---- ayanamsa (Lahiri, linear fit) ----
410 YF# = YR + (MO - 1) / 12#
420 GOSUB 3500 : REM -> AYAN#
430 REM
440 REM ---- panchanga elements ----
450 EL# = MLON# - SLON#
460 IF EL# < 0 THEN EL# = EL# + 360#
470 TI = INT(EL# / 12#) + 1 : REM tithi 1..30
480 NK = INT((MLON# - AYAN# + 360# * 4) / (360# / 27#))
490 NK = (NK MOD 27) + 1 : REM nakshatra 1..27
500 VR = (INT(JD# + .5#) + 1) MOD 7 : REM 0=Sun .. 6=Sat
510 REM
520 REM ---- names ----
530 GOSUB 4000 : REM sets TI$, PK$ (paksha), NK$, VR$
540 REM
550 REM ---- tabular Hijri ----
560 GOSUB 5000 : REM -> HY, HM, HD  and HM$
570 REM
580 REM ---- report ----
590 PRINT "----------------------------------------"
600 PRINT "JDN (Julian Day Number) : "; INT(JD# + .5#)
610 PRINT USING "Sun  longitude : ###.## deg"; SLON#
620 PRINT USING "Moon longitude : ###.## deg"; MLON#
630 PRINT USING "Ayanamsa (Lahiri): ##.#### deg"; AYAN#
640 PRINT
650 PRINT "PANCHANGA"
660 PRINT "  Tithi     : "; TI$; "  ("; PK$; " paksha, #"; MID$(STR$(TI),2); ")"
670 PRINT "  Nakshatra : "; NK$
680 PRINT "  Vara      : "; VR$
690 PRINT
700 PRINT "  Hijri (tabular) : "; HD; HM$; HY; " AH"
710 PRINT "----------------------------------------"
720 PRINT
730 INPUT "Another date (Y/N)? ", A$
740 IF A$ = "Y" OR A$ = "y" THEN GOTO 190
750 PRINT "Subh yatra. (goodbye)"
760 END
770 REM
2000 REM ==== day number & JDN ==================================
2010 REM  DN# = days since 2000-01-01 12:00 UT (Schlyter 'd')
2020 REM  d = 367*Y - (7*(Y+((M+9)\12)))\4 + (275*M)\9 + D - 730530 + UT/24
2030 Y = YR : M = MO : D = DY
2040 T1 = 367 * Y
2050 T2 = INT((7 * (Y + INT((M + 9) / 12))) / 4)
2060 T3 = INT((275 * M) / 9)
2070 DN# = T1 - T2 + T3 + D - 730530#
2080 DN# = DN# + UT# / 24#
2090 REM  JDN from day number: JD = d + 2451545.0
2100 JD# = DN# + 2451545#
2110 RETURN
2120 REM
2500 REM ==== Sun longitude (Schlyter low-precision) ============
2510 W# = 282.9404# + .0000470935# * DN#
2520 E# = .016709# - .000000001151# * DN#
2530 MA# = 356.047# + .9856002585# * DN#
2540 GOSUB 2900 : MA# = RV# : REM rev(MA)
2550 EA# = MA# + (180#/PI#) * E# * SIN(MA# * DR#) * (1# + E# * COS(MA# * DR#))
2560 XV# = COS(EA# * DR#) - E#
2570 YV# = SQR(1# - E# * E#) * SIN(EA# * DR#)
2580 YY# = YV# : XX# = XV# : GOSUB 9100 : VV# = (180#/PI#) * AT#
2590 SLON# = VV# + W#
2600 RV# = SLON# : GOSUB 2900 : SLON# = RV# : REM rev
2610 RETURN
2620 REM
3000 REM ==== Moon longitude (main terms) ======================
3010 NM# = 125.1228# - .0529538083# * DN#
3020 IM# = 5.1454#
3030 WM# = 318.0634# + .1643573223# * DN#
3040 AM# = 60.2666#
3050 EM# = .0549#
3060 MM# = 115.3654# + 13.0649929509# * DN#
3070 RV# = MM# : GOSUB 2900 : MM# = RV#
3080 REM  eccentric anomaly (two iterations for the Moon's larger e)
3090 EC# = MM# + (180#/PI#) * EM# * SIN(MM# * DR#) * (1# + EM# * COS(MM# * DR#))
3100 EC# = EC# - (EC# - (180#/PI#)*EM#*SIN(EC#*DR#) - MM#) / (1# - EM#*COS(EC#*DR#))
3110 XV# = AM# * (COS(EC# * DR#) - EM#)
3120 YV# = AM# * SQR(1# - EM# * EM#) * SIN(EC# * DR#)
3130 RM# = SQR(XV# * XV# + YV# * YV#)
3140 YY# = YV# : XX# = XV# : GOSUB 9100 : VM# = (180#/PI#) * AT#
3150 REM  position in ecliptic
3160 XH# = RM# * (COS(NM#*DR#)*COS((VM#+WM#)*DR#) - SIN(NM#*DR#)*SIN((VM#+WM#)*DR#)*COS(IM#*DR#))
3170 YH# = RM# * (SIN(NM#*DR#)*COS((VM#+WM#)*DR#) + COS(NM#*DR#)*SIN((VM#+WM#)*DR#)*COS(IM#*DR#))
3180 YY# = YH# : XX# = XH# : GOSUB 9100 : LO# = (180#/PI#) * AT#
3190 REM  main perturbations (largest terms only)
3200 RV# = MM# : GOSUB 2900 : MSUN# = 356.047# + .9856002585# * DN#
3210 RV# = MSUN# : GOSUB 2900 : MSUN# = RV#
3220 GOSUB 2500 : REM ensure SLON# / uses W# etc (recompute Sun mean)
3230 REM  D = mean elongation, F = arg. latitude
3240 DE# = LO# - SLON#
3250 FA# = LO# - NM#
3260 PT# = 0#
3270 PT# = PT# - 1.274# * SIN((MM# - 2#*DE#) * DR#)
3280 PT# = PT# + .658# * SIN(2#*DE# * DR#)
3290 PT# = PT# - .186# * SIN(MSUN# * DR#)
3300 PT# = PT# - .059# * SIN((2#*MM# - 2#*DE#) * DR#)
3310 PT# = PT# - .057# * SIN((MM# - 2#*DE# + MSUN#) * DR#)
3320 PT# = PT# + .053# * SIN((MM# + 2#*DE#) * DR#)
3330 PT# = PT# + .046# * SIN((2#*DE# - MSUN#) * DR#)
3340 PT# = PT# + .041# * SIN((MM# - MSUN#) * DR#)
3350 PT# = PT# - .035# * SIN(DE# * DR#)
3360 PT# = PT# - .031# * SIN((MM# + MSUN#) * DR#)
3370 MLON# = LO# + PT#
3380 RV# = MLON# : GOSUB 2900 : MLON# = RV#
3390 RETURN
3400 REM
3500 REM ==== Lahiri ayanamsa (linear fit, deg) ================
3510 AYAN# = 23.853# + .0139552# * (YF# - 2000#)
3520 RETURN
3530 REM
2900 REM ==== rev(): reduce angle to 0..360 ====================
2910 RV# = RV# - 360# * INT(RV# / 360#)
2920 IF RV# < 0 THEN RV# = RV# + 360#
2930 RETURN
2940 REM
4000 REM ==== names for tithi / paksha / nak / vara ============
4010 REM  tithi within paksha (1..15)
4020 TP = TI : IF TP > 15 THEN TP = TP - 15
4030 IF TI <= 15 THEN PK$ = "Shukla" ELSE PK$ = "Krishna"
4040 RESTORE 4500
4050 FOR I = 1 TO TP : READ TI$ : NEXT I
4060 RESTORE 4600
4070 FOR I = 1 TO NK : READ NK$ : NEXT I
4080 RESTORE 4700
4090 FOR I = 0 TO VR : READ VR$ : NEXT I
4100 RETURN
4110 REM
4500 DATA "Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami"
4510 DATA "Shashthi","Saptami","Ashtami","Navami","Dashami"
4520 DATA "Ekadashi","Dvadashi","Trayodashi","Chaturdashi","Purnima/Amavasya"
4600 DATA "Ashvini","Bharani","Krittika","Rohini","Mrigashira","Ardra"
4610 DATA "Punarvasu","Pushya","Ashlesha","Magha","P.Phalguni","U.Phalguni"
4620 DATA "Hasta","Chitra","Svati","Vishakha","Anuradha","Jyeshtha"
4630 DATA "Mula","P.Ashadha","U.Ashadha","Shravana","Dhanishtha","Shatabhisha"
4640 DATA "P.Bhadrapada","U.Bhadrapada","Revati"
4700 DATA "Ravivara","Somavara","Mangalavara","Budhavara"
4710 DATA "Guruvara","Shukravara","Shanivara"
4720 REM
5000 REM ==== tabular Hijri (Kuwaiti/Sunni 30-yr cycle) ========
5010 REM  from JDN -> Islamic Y/M/D (arithmetic, civil epoch 1948440)
5020 JI# = INT(JD# + .5#)
5030 LL# = JI# - 1948440# + 10632#
5040 NN = INT((LL# - 1#) / 10631#)
5050 LL# = LL# - 10631# * NN + 354#
5060 J1 = INT((10985# - LL#) / 5316#)
5070 J2 = INT((50# * LL#) / 17719#)
5080 J3 = INT(LL# / 5670#)
5090 J4 = INT((43# * LL#) / 15238#)
5100 JJ = J1 * J2 + J3 * J4 : REM select branch
5110 LL# = LL# - INT((30# - JJ) / 15#) * INT((17719# * JJ) / 50#)
5120 LL# = LL# - INT(JJ / 16#) * INT((15238# * JJ) / 43#) + 29#
5130 HM = INT((24# * LL#) / 709#)
5140 HD = LL# - INT((709# * HM) / 24#)
5150 HY = 30# * NN + JJ - 30#
5160 RESTORE 5500
5170 IF HM < 1 THEN HM = 1
5180 IF HM > 12 THEN HM = 12
5190 FOR I = 1 TO HM : READ HM$ : NEXT I
5200 RETURN
5210 REM
5500 DATA " Muharram "," Safar "," Rabi I "," Rabi II "
5510 DATA " Jumada I "," Jumada II "," Rajab "," Shaban "
5520 DATA " Ramadan "," Shawwal "," Dhu al-Qadah "," Dhu al-Hijjah "
5530 REM
9100 REM ==== atan2 helper: set AY#, AX#; returns AT# (radians) ====
9110 IF XX# = 0# AND YY# = 0# THEN AT# = 0# : RETURN
9120 IF XX# > 0# THEN AT# = ATN(YY# / XX#) : RETURN
9130 IF XX# < 0# AND YY# >= 0# THEN AT# = ATN(YY# / XX#) + PI# : RETURN
9140 IF XX# < 0# AND YY# < 0# THEN AT# = ATN(YY# / XX#) - PI# : RETURN
9150 IF XX# = 0# AND YY# > 0# THEN AT# = PI# / 2# : RETURN
9160 AT# = -PI# / 2# : RETURN
