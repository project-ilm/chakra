' ============================================================
'  CHAKRA.BAS  -  CHAKRA Temporal Cycle Observatory (QB64 build)
'  A graphical panchanga + astrolabe: the Moon and planets on a
'  zodiac ring, drawn from live geometry, with a panchanga panel.
'  Requires QB64 / QB64PE (uses SCREEN graphics + _RGB32).
'
'  Shares the same astronomy as the GW-BASIC port and the JS core
'  (src/chakra-core.js). Verified against it: for 2026-08-12 06:30 UT
'  Sun approximately 139.6 deg, Moon approximately 133.3 deg,
'  tithi Amavasya, Ashlesha, Budhavara.
'
'  Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
'  SPDX-License-Identifier: GPL-3.0-or-later. No warranty.
' ============================================================

OPTION _EXPLICIT
CONST PI = 3.14159265358979#
CONST DR = PI / 180#

DIM SHARED YR AS INTEGER, MO AS INTEGER, DY AS INTEGER, UT AS DOUBLE
DIM SHARED DN AS DOUBLE, JD AS DOUBLE
DIM SHARED SLON AS DOUBLE, MLON AS DOUBLE, AYAN AS DOUBLE

' rashi (sign) and body glyphs
DIM SHARED RASHI$(11), NAKS$(26), TITHIS$(14), VARAS$(6)
DIM SHARED PLON(5) AS DOUBLE      ' Sun..Saturn longitudes for the ring
DIM SHARED PNAME$(5), PCOL~&(5)

CALL InitTables

' ---- input ----
SCREEN 0: CLS
PRINT "CHAKRA - graphical panchanga (QB64)"
PRINT "-----------------------------------"
INPUT "Year  (e.g. 2026)  : ", YR
INPUT "Month (1-12)       : ", MO
INPUT "Day   (1-31)       : ", DY
INPUT "Hour  UT (0-23.99) : ", UT

' ---- compute ----
CALL DayNumber
CALL SunLon
CALL MoonLon
AYAN = 23.853# + .0139552# * ((YR + (MO - 1) / 12#) - 2000#)
CALL PlanetRing            ' fills PLON() for the astrolabe (approx.)

' ---- panchanga numbers ----
DIM EL AS DOUBLE, TI AS INTEGER, NK AS INTEGER, VR AS INTEGER
EL = MLON - SLON: IF EL < 0 THEN EL = EL + 360#
TI = INT(EL / 12#) + 1
NK = (INT((MLON - AYAN + 1440#) / (360# / 27#)) MOD 27) + 1
VR = (INT(JD + .5#) + 1) MOD 7

' ---- draw ----
CALL DrawAstrolabe(TI, NK, VR, EL)

' wait, then allow another
DIM k$
DO: k$ = INKEY$: LOOP UNTIL k$ <> ""
SCREEN 0: END

' ============================================================
SUB InitTables
    DIM i AS INTEGER
    DIM r$: r$ = "Mesha,Vrishabha,Mithuna,Karka,Simha,Kanya,Tula,Vrishchika,Dhanu,Makara,Kumbha,Mina"
    FOR i = 0 TO 11: RASHI$(i) = MID2$(r$, i + 1): NEXT
    DIM n$: n$ = "Ashvini,Bharani,Krittika,Rohini,Mrigashira,Ardra,Punarvasu,Pushya,Ashlesha,Magha,P.Phalguni,U.Phalguni,Hasta,Chitra,Svati,Vishakha,Anuradha,Jyeshtha,Mula,P.Ashadha,U.Ashadha,Shravana,Dhanishtha,Shatabhisha,P.Bhadra,U.Bhadra,Revati"
    FOR i = 0 TO 26: NAKS$(i) = MID2$(n$, i + 1): NEXT
    DIM t$: t$ = "Pratipada,Dvitiya,Tritiya,Chaturthi,Panchami,Shashthi,Saptami,Ashtami,Navami,Dashami,Ekadashi,Dvadashi,Trayodashi,Chaturdashi,Purnima/Amavasya"
    FOR i = 0 TO 14: TITHIS$(i) = MID2$(t$, i + 1): NEXT
    DIM v$: v$ = "Ravivara,Somavara,Mangalavara,Budhavara,Guruvara,Shukravara,Shanivara"
    FOR i = 0 TO 6: VARAS$(i) = MID2$(v$, i + 1): NEXT
    ' body ring
    PNAME$(0) = "Su": PCOL~&(0) = _RGB32(230, 180, 80)
    PNAME$(1) = "Me": PCOL~&(1) = _RGB32(159, 176, 192)
    PNAME$(2) = "Ve": PCOL~&(2) = _RGB32(208, 138, 90)
    PNAME$(3) = "Ma": PCOL~&(3) = _RGB32(224, 104, 90)
    PNAME$(4) = "Ju": PCOL~&(4) = _RGB32(217, 178, 74)
    PNAME$(5) = "Sa": PCOL~&(5) = _RGB32(138, 151, 184)
END SUB

' comma-list nth field (1-based)
FUNCTION MID2$ (s$, n AS INTEGER)
    DIM i AS INTEGER, c AS INTEGER, a AS INTEGER, b AS INTEGER
    c = 1: a = 1: b = LEN(s$) + 1
    FOR i = 1 TO LEN(s$)
        IF MID$(s$, i, 1) = "," THEN
            IF c = n THEN b = i: EXIT FOR
            c = c + 1: a = i + 1
        END IF
    NEXT
    MID2$ = MID$(s$, a, b - a)
END FUNCTION

FUNCTION Rev# (x AS DOUBLE)
    DIM r AS DOUBLE: r = x - 360# * INT(x / 360#)
    IF r < 0 THEN r = r + 360#
    Rev# = r
END FUNCTION

FUNCTION Atan2# (y AS DOUBLE, x AS DOUBLE)
    IF x = 0# AND y = 0# THEN Atan2# = 0#: EXIT FUNCTION
    IF x > 0# THEN Atan2# = ATN(y / x): EXIT FUNCTION
    IF x < 0# AND y >= 0# THEN Atan2# = ATN(y / x) + PI: EXIT FUNCTION
    IF x < 0# AND y < 0# THEN Atan2# = ATN(y / x) - PI: EXIT FUNCTION
    IF y > 0# THEN Atan2# = PI / 2# ELSE Atan2# = -PI / 2#
END FUNCTION

SUB DayNumber
    DIM t1 AS DOUBLE, t2 AS DOUBLE, t3 AS DOUBLE
    t1 = 367# * YR
    t2 = INT((7# * (YR + INT((MO + 9) / 12))) / 4)
    t3 = INT((275# * MO) / 9)
    DN = t1 - t2 + t3 + DY - 730530#
    DN = DN + UT / 24#
    JD = DN + 2451545#
END SUB

SUB SunLon
    DIM w AS DOUBLE, e AS DOUBLE, ma AS DOUBLE, ea AS DOUBLE
    DIM xv AS DOUBLE, yv AS DOUBLE, vv AS DOUBLE
    w = 282.9404# + .0000470935# * DN
    e = .016709# - .000000001151# * DN
    ma = Rev#(356.047# + .9856002585# * DN)
    ea = ma + (180# / PI) * e * SIN(ma * DR) * (1# + e * COS(ma * DR))
    xv = COS(ea * DR) - e
    yv = SQR(1# - e * e) * SIN(ea * DR)
    vv = (180# / PI) * Atan2#(yv, xv)
    SLON = Rev#(vv + w)
END SUB

SUB MoonLon
    DIM nm AS DOUBLE, im AS DOUBLE, wm AS DOUBLE, am AS DOUBLE, em AS DOUBLE, mm AS DOUBLE
    DIM ec AS DOUBLE, xv AS DOUBLE, yv AS DOUBLE, rm AS DOUBLE, vm AS DOUBLE
    DIM xh AS DOUBLE, yh AS DOUBLE, lo AS DOUBLE
    DIM msun AS DOUBLE, de AS DOUBLE, pt AS DOUBLE
    nm = 125.1228# - .0529538083# * DN
    im = 5.1454#
    wm = 318.0634# + .1643573223# * DN
    am = 60.2666#
    em = .0549#
    mm = Rev#(115.3654# + 13.0649929509# * DN)
    ec = mm + (180# / PI) * em * SIN(mm * DR) * (1# + em * COS(mm * DR))
    ec = ec - (ec - (180# / PI) * em * SIN(ec * DR) - mm) / (1# - em * COS(ec * DR))
    xv = am * (COS(ec * DR) - em)
    yv = am * SQR(1# - em * em) * SIN(ec * DR)
    rm = SQR(xv * xv + yv * yv)
    vm = (180# / PI) * Atan2#(yv, xv)
    xh = rm * (COS(nm * DR) * COS((vm + wm) * DR) - SIN(nm * DR) * SIN((vm + wm) * DR) * COS(im * DR))
    yh = rm * (SIN(nm * DR) * COS((vm + wm) * DR) + COS(nm * DR) * SIN((vm + wm) * DR) * COS(im * DR))
    lo = (180# / PI) * Atan2#(yh, xh)
    msun = Rev#(356.047# + .9856002585# * DN)
    de = lo - SLON
    pt = 0#
    pt = pt - 1.274# * SIN((mm - 2# * de) * DR)
    pt = pt + .658# * SIN(2# * de * DR)
    pt = pt - .186# * SIN(msun * DR)
    pt = pt - .059# * SIN((2# * mm - 2# * de) * DR)
    pt = pt - .057# * SIN((mm - 2# * de + msun) * DR)
    pt = pt + .053# * SIN((mm + 2# * de) * DR)
    pt = pt + .046# * SIN((2# * de - msun) * DR)
    pt = pt + .041# * SIN((mm - msun) * DR)
    pt = pt - .035# * SIN(de * DR)
    pt = pt - .031# * SIN((mm + msun) * DR)
    MLON = Rev#(lo + pt)
END SUB

' Approximate heliocentric->geocentric longitudes for the visible planets,
' good enough to place them on the astrolabe ring (not chart-grade).
SUB PlanetRing
    PLON(0) = SLON
    ' crude mean longitudes for Me,Ve,Ma,Ju,Sa (geocentric approx via elongation of mean)
    PLON(1) = Rev#(SLON + 20# * SIN((48.0# + 4.0923# * DN) * DR))      ' Mercury swing
    PLON(2) = Rev#(SLON + 45# * SIN((76.7# + 1.6021# * DN) * DR))      ' Venus swing
    PLON(3) = Rev#(293.9# + .524039# * DN)                            ' Mars mean
    PLON(4) = Rev#(34.35# + .083091# * DN)                            ' Jupiter mean
    PLON(5) = Rev#(50.08# + .033460# * DN)                            ' Saturn mean
END SUB

SUB DrawAstrolabe (TI AS INTEGER, NK AS INTEGER, VR AS INTEGER, EL AS DOUBLE)
    DIM sw AS INTEGER, sh AS INTEGER
    sw = 900: sh = 640
    SCREEN _NEWIMAGE(sw, sh, 32)
    _TITLE "CHAKRA - Astrolabe"
    CLS , _RGB32(5, 7, 14)

    DIM cx AS INTEGER, cy AS INTEGER, R AS INTEGER, i AS INTEGER
    cx = 300: cy = 320: R = 250

    ' outer ring
    CircleC cx, cy, R, _RGB32(120, 140, 190), 1
    CircleC cx, cy, R - 30, _RGB32(70, 90, 130), 1

    ' 12 rashi spokes + labels (0 deg Aries at top, longitude increases CCW)
    FOR i = 0 TO 11
        DIM a AS DOUBLE, x1 AS INTEGER, y1 AS INTEGER, x2 AS INTEGER, y2 AS INTEGER
        a = (-90 - i * 30) * DR
        x1 = cx + (R - 30) * COS(a): y1 = cy + (R - 30) * SIN(a)
        x2 = cx + R * COS(a): y2 = cy + R * SIN(a)
        LINE (x1, y1)-(x2, y2), _RGB32(90, 110, 150)
        DIM la AS DOUBLE, lx AS INTEGER, ly AS INTEGER
        la = (-90 - (i * 30 + 15)) * DR
        lx = cx + (R - 16) * COS(la): ly = cy + (R - 16) * SIN(la)
        COLOR _RGB32(150, 170, 210): _PRINTSTRING (lx - 10, ly - 6), LEFT$(RASHI$(i), 3)
    NEXT

    ' planets on the ring
    FOR i = 0 TO 5
        DIM pa AS DOUBLE, px AS INTEGER, py AS INTEGER
        pa = (-90 - PLON(i)) * DR
        px = cx + R * COS(pa): py = cy + R * SIN(pa)
        FillCircle px, py, 6, PCOL~&(i)
        COLOR PCOL~&(i): _PRINTSTRING (px - 8, py - 20), PNAME$(i)
    NEXT

    ' Moon marker on ring
    DIM ma2 AS DOUBLE, mx AS INTEGER, my AS INTEGER
    ma2 = (-90 - MLON) * DR
    mx = cx + R * COS(ma2): my = cy + R * SIN(ma2)
    FillCircle mx, my, 7, _RGB32(232, 236, 247)

    ' central Moon disc with terminator (illuminated fraction from elongation)
    DIM Rm AS INTEGER: Rm = 90
    FillCircle cx, cy, Rm, _RGB32(20, 26, 44)
    CircleC cx, cy, Rm, _RGB32(180, 195, 230), 1
    DIM illum AS DOUBLE
    illum = (1# - COS(EL * DR)) / 2#
    ' draw lit portion as vertical scan (simple, robust)
    DIM yy AS INTEGER, halfw AS DOUBLE, k AS DOUBLE, xoff AS INTEGER, waxing AS INTEGER
    k = COS(EL * DR)                 ' +1 new .. -1 full
    waxing = (EL <= 180#)
    FOR yy = -Rm TO Rm
        halfw = SQR(Rm * Rm - yy * yy)
        ' terminator x at this row
        DIM tx AS DOUBLE
        tx = k * halfw
        IF illum > .01 THEN
            DIM xa AS INTEGER, xb AS INTEGER
            IF waxing THEN
                xa = INT(tx): xb = INT(halfw)      ' lit on the right as it waxes
            ELSE
                xa = INT(-halfw): xb = INT(tx)
            END IF
            IF xb > xa THEN LINE (cx + xa, cy + yy)-(cx + xb, cy + yy), _RGB32(220, 226, 240)
        END IF
    NEXT
    CircleC cx, cy, Rm, _RGB32(216, 169, 78), 1

    ' ---- panchanga panel (right side) ----
    DIM panx AS INTEGER: panx = 610
    COLOR _RGB32(95, 227, 255): _PRINTSTRING (panx, 40), "C H A K R A"
    COLOR _RGB32(115, 133, 160): _PRINTSTRING (panx, 60), "Temporal Cycle Observatory"
    LINE (panx, 78)-(sw - 30, 78), _RGB32(70, 90, 130)

    DIM row AS INTEGER: row = 110
    DIM d$
    d$ = LTRIM$(STR$(DY)) + "-" + LTRIM$(STR$(MO)) + "-" + LTRIM$(STR$(YR))
    PanLine panx, row, "Date (UT)", d$ + "  " + FmtHr$(UT): row = row + 26
    PanLine panx, row, "JDN", LTRIM$(STR$(INT(JD + .5#))): row = row + 26
    PanLine panx, row, "Sun lon", FmtDeg$(SLON): row = row + 22
    PanLine panx, row, "Moon lon", FmtDeg$(MLON): row = row + 22
    PanLine panx, row, "Ayanamsa", FmtDeg$(AYAN): row = row + 30

    COLOR _RGB32(216, 169, 78): _PRINTSTRING (panx, row), "PANCHANGA": row = row + 24
    DIM tp AS INTEGER, pk$
    tp = TI: IF tp > 15 THEN tp = tp - 15
    IF TI <= 15 THEN pk$ = "Shukla" ELSE pk$ = "Krishna"
    PanLine panx, row, "Tithi", TITHIS$(tp - 1) + " (" + pk$ + ")": row = row + 22
    PanLine panx, row, "Nakshatra", NAKS$(NK - 1): row = row + 22
    PanLine panx, row, "Vara", VARAS$(VR): row = row + 22
    PanLine panx, row, "Illum", LTRIM$(STR$(INT(illum * 100# + .5#))) + "%": row = row + 34

    COLOR _RGB32(61, 75, 100)
    _PRINTSTRING (panx, row), "Computed, not looked up.": row = row + 16
    _PRINTSTRING (panx, row), "(c) 1993-2026 A. Choudhary": row = row + 16
    _PRINTSTRING (30, sh - 24), "Press any key to exit."
END SUB

SUB PanLine (x AS INTEGER, y AS INTEGER, k$, v$)
    COLOR _RGB32(115, 133, 160): _PRINTSTRING (x, y), k$
    COLOR _RGB32(220, 226, 240): _PRINTSTRING (x + 120, y), v$
END SUB

FUNCTION FmtDeg$ (v AS DOUBLE)
    FmtDeg$ = LTRIM$(STR$(INT(v * 100# + .5#) / 100#)) + " deg"
END FUNCTION

FUNCTION FmtHr$ (h AS DOUBLE)
    DIM hh AS INTEGER, mm AS INTEGER
    hh = INT(h): mm = INT((h - hh) * 60# + .5#)
    DIM a$, b$
    a$ = RIGHT$("0" + LTRIM$(STR$(hh)), 2)
    b$ = RIGHT$("0" + LTRIM$(STR$(mm)), 2)
    FmtHr$ = a$ + ":" + b$ + " UT"
END FUNCTION

SUB CircleC (cx AS INTEGER, cy AS INTEGER, r AS INTEGER, c AS _UNSIGNED LONG, w AS INTEGER)
    CIRCLE (cx, cy), r, c
END SUB

SUB FillCircle (cx AS INTEGER, cy AS INTEGER, r AS INTEGER, c AS _UNSIGNED LONG)
    DIM yy AS INTEGER, xx AS DOUBLE
    FOR yy = -r TO r
        xx = SQR(r * r - yy * yy)
        LINE (cx - xx, cy + yy)-(cx + xx, cy + yy), c
    NEXT
END SUB
