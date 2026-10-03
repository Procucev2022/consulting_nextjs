'use client';

/**
 * Enterprise User Login & Registration Page (Prompt 290 & 292)
 * Light Premium Enterprise Theme: Refined design with 52% Value Story / 48% Action & Conversion.
 * Desktop: Centered 1560px container, vertically centered dual-column layout.
 * Mobile: Strategic single-column ordering prioritizing early authentication.
 */

import React from 'react';
import { LoginBenefitsShowcase } from '../../components/LoginBenefitsShowcase';
import { AuthCard } from '../../components/auth/AuthCard';

export default function LoginPage(): React.ReactElement {
  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
      style={{
        background:
          'radial-gradient(ellipse at 15% 15%, rgba(14, 165, 233, 0.08) 0%, transparent 45%), ' +
          'radial-gradient(ellipse at 85% 85%, rgba(16, 185, 129, 0.05) 0%, transparent 45%), ' +
          'linear-gradient(180deg, #F8FBFE 0%, #EEF7FF 100%)',
        color: '#0B1B33',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      <div className="w-full max-w-[1560px] mx-auto my-auto flex flex-col lg:grid lg:grid-cols-[13fr_12fr] gap-8 xl:gap-12 lg:items-center">
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

