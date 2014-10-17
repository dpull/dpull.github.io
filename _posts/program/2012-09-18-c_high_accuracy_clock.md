---
layout: post
title: 高精度时钟
categories: [general]
tags: [c]
---

整理自 [gperftools](http://code.google.com/p/gperftools/)

----------
	
      {% highlight C++ %}
      #ifndef GOOGLE_BASE_CYCLECLOCK_H_
      #define GOOGLE_BASE_CYCLECLOCK_H_
    
      // #include "base/arm_instruction_set_select.h"
      // start "arm_instruction_set_select.h"
      #ifndef ARM_INSTRUCTION_SET_SELECT_H_
      #define ARM_INSTRUCTION_SET_SELECT_H_
    
      #if defined(__ARM_ARCH_7__) || \
          defined(__ARM_ARCH_7R__) || \
          defined(__ARM_ARCH_7A__)
      # define ARMV7 1
      #endif
    
      #if defined(ARMV7) || \
          defined(__ARM_ARCH_6__) || \
          defined(__ARM_ARCH_6J__) || \
          defined(__ARM_ARCH_6K__) || \
          defined(__ARM_ARCH_6Z__) || \
          defined(__ARM_ARCH_6T2__) || \
          defined(__ARM_ARCH_6ZK__)
      # define ARMV6 1
      #endif
    
      #if defined(ARMV6) || \
          defined(__ARM_ARCH_5T__) || \
          defined(__ARM_ARCH_5E__) || \
          defined(__ARM_ARCH_5TE__) || \
          defined(__ARM_ARCH_5TEJ__)
      # define ARMV5 1
      #endif
    
      #if defined(ARMV5) || \
          defined(__ARM_ARCH_4__) || \
          defined(__ARM_ARCH_4T__)
      # define ARMV4 1
      #endif
    
      #if defined(ARMV4) || \
          defined(__ARM_ARCH_3__) || \
          defined(__ARM_ARCH_3M__)
      # define ARMV3 1
      #endif
    
      #if defined(ARMV3) || \
          defined(__ARM_ARCH_2__)
      # define ARMV2 1
      #endif
    
      #endif  // ARM_INSTRUCTION_SET_SELECT_H_
      // end "arm_instruction_set_select.h"
    
      // base/sysinfo.h is really big and we don't want to include it unless
      // it is necessary.
      #if defined(__arm__) || defined(__mips__)
      // # include "base/sysinfo.h"
      // file
      inline double CyclesPerSecond(void)
      {
          // 该函数没有移植
          return 1.0;  // 0.0 might be dangerous
      }
      #endif
      #if defined(__MACH__) && defined(__APPLE__)
      # include <mach/mach_time.h>
      #endif
      // For MSVC, we want to use '_asm rdtsc' when possible (since it works
      // with even ancient MSVC compilers), and when not possible the
      // __rdtsc intrinsic, declared in <intrin.h>.  Unfortunately, in some
      // environments, <windows.h> and <intrin.h> have conflicting
      // declarations of some other intrinsics, breaking compilation.
      // Therefore, we simply declare __rdtsc ourselves. See also
      // http://connect.microsoft.com/VisualStudio/feedback/details/262047
      #if defined(_MSC_VER) && !defined(_M_IX86)
      extern "C" uint64 __rdtsc();
      #pragma intrinsic(__rdtsc)
      #endif
      #if defined(ARMV3) || defined(__mips__)
      #include <sys/time.h>
      #endif
    
      // NOTE: only i386 and x86_64 have been well tested.
      // PPC, sparc, alpha, and ia64 are based on
      //    http://peter.kuscsik.com/wordpress/?p=14
      // with modifications by m3b.  See also
      //    https://setisvn.ssl.berkeley.edu/svn/lib/fftw-3.0.1/kernel/cycle.h
      struct CycleClock {
        // This should return the number of cycles since power-on.  Thread-safe.
        static int64_t Now() {
      #if defined(__MACH__) && defined(__APPLE__)
          // this goes at the top because we need ALL Macs, regardless of
          // architecture, to return the number of "mach time units" that
          // have passed since startup.  See sysinfo.cc where
          // InitializeSystemInfo() sets the supposed cpu clock frequency of
          // macs to the number of mach time units per second, not actual
          // CPU clock frequency (which can change in the face of CPU
          // frequency scaling).  Also note that when the Mac sleeps, this
          // counter pauses; it does not continue counting, nor does it
          // reset to zero.
          return mach_absolute_time();
      #elif defined(__i386__)
          int64_t ret;
          __asm__ volatile ("rdtsc" : "=A" (ret) );
          return ret;
      #elif defined(__x86_64__) || defined(__amd64__)
          uint64_t low, high;
          __asm__ volatile ("rdtsc" : "=a" (low), "=d" (high));
          return (high << 32) | low;
      #elif defined(__powerpc64__) || defined(__ppc64__)
          uint64_t tb;
          __asm__ volatile (\
            "mfspr %0, 268"
            : "=r" (tb));
          return tb;
      #elif defined(__powerpc__) || defined(__ppc__)
          // This returns a time-base, which is not always precisely a cycle-count.
          uint32_t tbu, tbl, tmp;
          __asm__ volatile (\
            "0:\n"
            "mftbu %0\n"
            "mftbl %1\n"
            "mftbu %2\n"
            "cmpw %0, %2\n"
            "bne- 0b"
            : "=r" (tbu), "=r" (tbl), "=r" (tmp));
          return (((uint64_t) tbu << 32) | tbl);
      #elif defined(__sparc__)
          int64_t tick;
          asm(".byte 0x83, 0x41, 0x00, 0x00");
          asm("mov   %%g1, %0" : "=r" (tick));
          return tick;
      #elif defined(__ia64__)
          int64_t itc;
          asm("mov %0 = ar.itc" : "=r" (itc));
          return itc;
      #elif defined(_MSC_VER) && defined(_M_IX86)
          // Older MSVC compilers (like 7.x) don't seem to support the
          // __rdtsc intrinsic properly, so I prefer to use _asm instead
          // when I know it will work.  Otherwise, I'll use __rdtsc and hope
          // the code is being compiled with a non-ancient compiler.
          _asm rdtsc
      #elif defined(_MSC_VER)
          return __rdtsc();
      #elif defined(ARMV3)
      #if defined(ARMV6)  // V6 is the earliest arch that has a standard cyclecount
          uint32_t pmccntr;
          uint32_t pmuseren;
          uint32_t pmcntenset;
          // Read the user mode perf monitor counter access permissions.
          asm volatile ("mrc p15, 0, %0, c9, c14, 0" : "=r" (pmuseren));
          if (pmuseren & 1) {  // Allows reading perfmon counters for user mode code.
            asm volatile ("mrc p15, 0, %0, c9, c12, 1" : "=r" (pmcntenset));
            if (pmcntenset & 0x80000000ul) {  // Is it counting?
              asm volatile ("mrc p15, 0, %0, c9, c13, 0" : "=r" (pmccntr));
              // The counter is set up to count every 64th cycle
              return static_cast<int64>(pmccntr) * 64;  // Should optimize to << 6
            }
          }
      #endif
          struct timeval tv;
          gettimeofday(&tv, NULL);
          return static_cast<int64_t>((tv.tv_sec + tv.tv_usec * 0.000001)
                                    * CyclesPerSecond());
      #elif defined(__mips__)
          // mips apparently only allows rdtsc for superusers, so we fall
          // back to gettimeofday.  It's possible clock_gettime would be better.
          struct timeval tv;
          gettimeofday(&tv, NULL);
          return static_cast<int64_t>((tv.tv_sec + tv.tv_usec * 0.000001)
                                    * CyclesPerSecond());
      #else
      // The soft failover to a generic implementation is automatic only for ARM.
      // For other platforms the developer is expected to make an attempt to create
      // a fast implementation and use generic version if nothing better is available.
      #error You need to define CycleTimer for your O/S and CPU
      #endif
        }
      };
    
      #endif  // GOOGLE_BASE_CYCLECLOCK_H_
      {% endhighlight %}

	
