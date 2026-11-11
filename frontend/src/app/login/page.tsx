'use client';

/**
 * Enterprise User Login & Registration Page (Prompt 290, 292, 605 & 614)
 * Light Premium Enterprise Theme: Refined design with 52% Value Story / 48% Action & Conversion.
 * Desktop: Centered 1440px container, vertically centered dual-column layout.
 * Dynamic Scrolling: Comfortably fits in viewport on standard screens, seamlessly scrollable
 * when expanding to larger forms (e.g. Create Account) or on compact viewports.
 * Mobile: Strategic single-column ordering prioritizing early authentication.
 */

import React from 'react';
import { LoginBenefitsShowcase } from '../../components/LoginBenefitsShowcase';
import { AuthCard } from '../../components/auth/AuthCard';

export default function LoginPage(): React.ReactElement {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6 xl:px-12 xl:py-8 overflow-y-auto"
      style={{
        background:
          'radial-gradient(ellipse at 15% 15%, rgba(14, 165, 233, 0.08) 0%, transparent 45%), ' +
          'radial-gradient(ellipse at 85% 85%, rgba(16, 185, 129, 0.05) 0%, transparent 45%), ' +
          'linear-gradient(180deg, #F8FBFE 0%, #EEF7FF 100%)',
        color: '#0B1B33',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      <div className="w-full max-w-[1400px] xl:max-w-[1480px] mx-auto my-auto flex flex-col lg:grid lg:grid-cols-[13fr_11fr] xl:grid-cols-[14fr_11fr] gap-4 xl:gap-8 lg:items-center">
        {/* Left Column on Desktop / Ordered sections on Mobile */}
        <LoginBenefitsShowcase />

        {/* Right Column on Desktop (~48%) / 4th item on Mobile */}
        <div className="order-4 lg:order-none flex flex-col items-center justify-center w-full">
          <AuthCard />
        </div>
      </div>
    </div>
  );
}
