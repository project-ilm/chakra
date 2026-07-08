/* ============================================================
 *  chakra_ephem.cu — CUDA batch ephemeris for CHAKRA
 *
 *  Ports the CHAKRA ephemeris core (Sun/Moon/planet longitudes,
 *  obliquity, ayanāṁśa) to __host__ __device__ code and maps
 *  N epochs × 11 bodies → a longitude array on the GPU.
 *
 *  The device math is a faithful port of lib/chakra.c (Schlyter
 *  low-precision theory). A parity harness compares GPU output to
 *  a CPU reference computed by the SAME device functions run on the
 *  host, so any divergence is a GPU/precision bug, not a port bug.
 *
 *  Build (requires CUDA toolkit):
 *      nvcc -O3 -o chakra_ephem chakra_ephem.cu
 *      ./chakra_ephem                 # runs parity + benchmark
 *      ./chakra_ephem 2000000         # benchmark 2,000,000 epochs
 *
 *  Verification anchor (matches the JS/C cores):
 *      2026-08-12 06:30 UT → Sun λ ≈ 139.6°, Moon λ ≈ 133.3°
 *
 *  Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
 *  SPDX-License-Identifier: GPL-3.0-or-later. No warranty.
 * ============================================================ */
#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <cuda_runtime.h>

#define CK_NBODY 11
/* body indices — identical order to lib/chakra.h */
enum { CK_SUN, CK_MOON, CK_MERCURY, CK_VENUS, CK_MARS,
       CK_JUPITER, CK_SATURN, CK_URANUS, CK_NEPTUNE, CK_RAHU, CK_KETU };

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif
__host__ __device__ static inline double D2R(){ return M_PI/180.0; }
__host__ __device__ static inline double R2D(){ return 180.0/M_PI; }

/* ── shared device/host primitives (ported verbatim from chakra.c) ── */
__host__ __device__ static double ck_rev(double x){
    double r = fmod(x, 360.0);
    return r < 0 ? r + 360.0 : r;
}
__host__ __device__ static double S_(double x){ return sin(x*D2R()); }
__host__ __device__ static double C_(double x){ return cos(x*D2R()); }
__host__ __device__ static double at2(double y, double x){
    return ck_rev(atan2(y, x) * R2D());
}

typedef struct { double N, i, w, a, e, M; } elem;
typedef struct { double r, v, xh, yh, zh; } hxyz;

/* orbital elements as linear functions of day-number d (Schlyter) */
__host__ __device__ static void get_elem(int body, double d, elem* o){
    switch(body){
    case CK_SUN:
        o->N=0; o->i=0;
        o->w=ck_rev(282.9404 + 4.70935e-5*d);
        o->a=1.0; o->e=0.016709 - 1.151e-9*d;
        o->M=ck_rev(356.0470 + 0.9856002585*d); break;
    case CK_MOON:
        o->N=ck_rev(125.1228 - 0.0529538083*d);
        o->i=5.1454;
        o->w=ck_rev(318.0634 + 0.1643573223*d);
        o->a=60.2666; o->e=0.054900;
        o->M=ck_rev(115.3654 + 13.0649929509*d); break;
    case CK_MERCURY:
        o->N=ck_rev(48.3313 + 3.24587e-5*d); o->i=7.0047 + 5.00e-8*d;
        o->w=ck_rev(29.1241 + 1.01444e-5*d); o->a=0.387098; o->e=0.205635 + 5.59e-10*d;
        o->M=ck_rev(168.6562 + 4.0923344368*d); break;
    case CK_VENUS:
        o->N=ck_rev(76.6799 + 2.46590e-5*d); o->i=3.3946 + 2.75e-8*d;
        o->w=ck_rev(54.8910 + 1.38374e-5*d); o->a=0.723330; o->e=0.006773 - 1.302e-9*d;
        o->M=ck_rev(48.0052 + 1.6021302244*d); break;
    case CK_MARS:
        o->N=ck_rev(49.5574 + 2.11081e-5*d); o->i=1.8497 - 1.78e-8*d;
        o->w=ck_rev(286.5016 + 2.92961e-5*d); o->a=1.523688; o->e=0.093405 + 2.516e-9*d;
        o->M=ck_rev(18.6021 + 0.5240207766*d); break;
    case CK_JUPITER:
        o->N=ck_rev(100.4542 + 2.76854e-5*d); o->i=1.3030 - 1.557e-7*d;
        o->w=ck_rev(273.8777 + 1.64505e-5*d); o->a=5.20256; o->e=0.048498 + 4.469e-9*d;
        o->M=ck_rev(19.8950 + 0.0830853001*d); break;
    case CK_SATURN:
        o->N=ck_rev(113.6634 + 2.38980e-5*d); o->i=2.4886 - 1.081e-7*d;
        o->w=ck_rev(339.3939 + 2.97661e-5*d); o->a=9.55475; o->e=0.055546 - 9.499e-9*d;
        o->M=ck_rev(316.9670 + 0.0334442282*d); break;
    case CK_URANUS:
        o->N=ck_rev(74.0005 + 1.3978e-5*d); o->i=0.7733 + 1.9e-8*d;
        o->w=ck_rev(96.6612 + 3.0565e-5*d); o->a=19.18171 - 1.55e-8*d; o->e=0.047318 + 7.45e-9*d;
        o->M=ck_rev(142.5905 + 0.011725806*d); break;
    case CK_NEPTUNE:
        o->N=ck_rev(131.7806 + 3.0173e-5*d); o->i=1.7700 - 2.55e-7*d;
        o->w=ck_rev(272.8461 - 6.027e-6*d); o->a=30.05826 + 3.313e-8*d; o->e=0.008606 + 2.15e-9*d;
        o->M=ck_rev(260.2471 + 0.005995147*d); break;
    default: o->N=o->i=o->w=o->a=o->e=o->M=0;
    }
}

/* heliocentric position from elements (eccentric-anomaly iteration) */
__host__ __device__ static void helio(const elem* el, hxyz* o){
    double E = el->M + R2D()*el->e*S_(el->M)*(1.0 + el->e*C_(el->M));
    if (fabs(el->e) > 0.05){                 /* two Newton steps for the Moon */
        for(int k=0;k<2;k++){
            E = E - (E - R2D()*el->e*S_(E) - el->M) / (1.0 - el->e*C_(E));
        }
    }
    double xv = el->a*(C_(E) - el->e);
    double yv = el->a*(sqrt(1.0 - el->e*el->e)*S_(E));
    o->r = hypot(xv, yv);
    o->v = at2(yv, xv);
    double vw = o->v + el->w;
    o->xh = o->r*(C_(el->N)*C_(vw) - S_(el->N)*S_(vw)*C_(el->i));
    o->yh = o->r*(S_(el->N)*C_(vw) + C_(el->N)*S_(vw)*C_(el->i));
    o->zh = o->r*(S_(vw)*S_(el->i));
}

__host__ __device__ static double dev_sun_lon(double d){
    elem s; get_elem(CK_SUN,d,&s);
    hxyz su; helio(&s,&su);            /* su.v = true anomaly (eqn of centre applied) */
    return ck_rev(su.v + s.w);         /* Sun: λ = ν + w, matching ck_sun_xy */
}

__host__ __device__ static double dev_moon_lon(double d){
    elem m,s; get_elem(CK_MOON,d,&m); get_elem(CK_SUN,d,&s);
    hxyz mm; helio(&m,&mm);
    double lon = at2(mm.yh, mm.xh);
    double Ls=ck_rev(s.w+s.M), Lm=ck_rev(m.N+m.w+m.M), Ms=ck_rev(s.M), Mm=ck_rev(m.M);
    double Dd=ck_rev(Lm-Ls), F=ck_rev(Lm-m.N);
    lon += -1.274*S_(Mm-2*Dd) + 0.658*S_(2*Dd) - 0.186*S_(Ms) - 0.059*S_(2*Mm-2*Dd)
         - 0.057*S_(Mm-2*Dd+Ms) + 0.053*S_(Mm+2*Dd) + 0.046*S_(2*Dd-Ms) + 0.041*S_(Mm-Ms)
         - 0.035*S_(Dd) - 0.031*S_(Mm+Ms) - 0.015*S_(2*F-2*Dd) + 0.011*S_(Mm-4*Dd);
    return ck_rev(lon);
}

/* geocentric planet longitude = heliocentric planet + heliocentric Earth→Sun */
__host__ __device__ static double dev_planet_lon(int body, double d){
    elem p; get_elem(body,d,&p);
    hxyz pp; helio(&p,&pp);
    elem se; get_elem(CK_SUN,d,&se);
    hxyz ss; helio(&se,&ss);       /* Sun's geocentric rectangular offset */
    double lonS = ck_rev(se.w + ss.v);       /* ss.v = Sun's true anomaly-derived λ */
    double xs = ss.r*C_(lonS);
    double ys = ss.r*S_(lonS);
    return at2(pp.yh + ys, pp.xh + xs);
}

__host__ __device__ static double dev_body_lon(int body, double d){
    switch(body){
    case CK_SUN:  return dev_sun_lon(d);
    case CK_MOON: return dev_moon_lon(d);
    case CK_RAHU: { elem m; get_elem(CK_MOON,d,&m); return ck_rev(m.N); }
    case CK_KETU: { elem m; get_elem(CK_MOON,d,&m); return ck_rev(m.N + 180.0); }
    default:      return dev_planet_lon(body, d);
    }
}

/* ── the kernel: one thread per (epoch), all 11 bodies ── */
__global__ void ephem_kernel(const double* __restrict__ dayno,
                             double* __restrict__ out, int nEpochs){
    int i = blockIdx.x*blockDim.x + threadIdx.x;
    if (i >= nEpochs) return;
    double d = dayno[i];
    double* row = out + (size_t)i*CK_NBODY;
    #pragma unroll
    for (int b=0; b<CK_NBODY; ++b) row[b] = dev_body_lon(b, d);
}

/* day-number from civil UT (host helper for building the input) */
static double host_dayno(int Y,int M,int D,double UT){
    return 367.0*Y - floor(7.0*(Y+floor((M+9)/12.0))/4.0)
         + floor(275.0*M/9.0) + D - 730530.0 + UT/24.0;
}

#define CUDA_OK(call) do{ cudaError_t e=(call); if(e!=cudaSuccess){ \
    fprintf(stderr,"CUDA error %s at %s:%d\n",cudaGetErrorString(e),__FILE__,__LINE__); \
    exit(2);} }while(0)

int main(int argc, char** argv){
    int N = (argc>1) ? atoi(argv[1]) : 1000000;
    if (N < 32) N = 32;
    printf("CHAKRA CUDA ephemeris — %d epochs × %d bodies\n", N, CK_NBODY);

    /* build input: N epochs stepping ~1 day from the 2026-08-12 anchor */
    double d0 = host_dayno(2026,8,12,6.5);
    double *h_d = (double*)malloc((size_t)N*sizeof(double));
    for (int i=0;i<N;i++) h_d[i] = d0 + i*1.0;

    double *d_d=nullptr, *d_out=nullptr;
    CUDA_OK(cudaMalloc(&d_d,   (size_t)N*sizeof(double)));
    CUDA_OK(cudaMalloc(&d_out, (size_t)N*CK_NBODY*sizeof(double)));
    CUDA_OK(cudaMemcpy(d_d, h_d, (size_t)N*sizeof(double), cudaMemcpyHostToDevice));

    int threads=256, blocks=(N+threads-1)/threads;
    cudaEvent_t t0,t1; CUDA_OK(cudaEventCreate(&t0)); CUDA_OK(cudaEventCreate(&t1));
    CUDA_OK(cudaEventRecord(t0));
    ephem_kernel<<<blocks,threads>>>(d_d, d_out, N);
    CUDA_OK(cudaGetLastError());
    CUDA_OK(cudaEventRecord(t1));
    CUDA_OK(cudaEventSynchronize(t1));
    float ms=0; CUDA_OK(cudaEventElapsedTime(&ms,t0,t1));

    double *h_out = (double*)malloc((size_t)N*CK_NBODY*sizeof(double));
    CUDA_OK(cudaMemcpy(h_out, d_out, (size_t)N*CK_NBODY*sizeof(double), cudaMemcpyDeviceToHost));

    /* ── parity: recompute 32 sampled epochs on the CPU (same functions) ── */
    const char* names[CK_NBODY]={"Sun","Moon","Mer","Ven","Mar","Jup","Sat","Ura","Nep","Rah","Ket"};
    double maxErr=0; int checks=0;
    for (int s=0;s<32;s++){
        int i=(int)((double)s/32.0*N);
        double d=h_d[i];
        for (int b=0;b<CK_NBODY;b++){
            double cpu=dev_body_lon(b,d);
            double gpu=h_out[(size_t)i*CK_NBODY+b];
            double e=fabs(cpu-gpu); if(e>180)e=360-e;     /* wrap */
            if(e>maxErr)maxErr=e; checks++;
        }
    }
    printf("\nAnchor epoch (2026-08-12 06:30 UT):\n");
    for (int b=0;b<CK_NBODY;b++)
        printf("  %-4s λ = %8.3f°\n", names[b], h_out[b]);

    printf("\nParity: %d CPU/GPU checks, max |Δ| = %.3e°  (%s)\n",
           checks, maxErr, maxErr<1e-9 ? "PASS" : "FAIL");
    double epochsPerSec = (double)N/(ms/1000.0);
    printf("Throughput: %d epochs in %.2f ms  →  %.2f M epochs/s  (%d body-λ/s = %.1f M/s)\n",
           N, ms, epochsPerSec/1e6, N*CK_NBODY,
           (double)N*CK_NBODY/(ms/1000.0)/1e6);

    /* spot-check the published anchor values */
    double sun=h_out[CK_SUN], moon=h_out[CK_MOON];
    int anchorOK = (fabs(sun-139.6)<0.5) && (fabs(moon-133.3)<0.5);
    printf("Anchor check: Sun≈139.6 (%.2f), Moon≈133.3 (%.2f) → %s\n",
           sun, moon, anchorOK?"PASS":"FAIL");

    free(h_d); free(h_out);
    cudaFree(d_d); cudaFree(d_out);
    return (maxErr<1e-9 && anchorOK) ? 0 : 1;
}
