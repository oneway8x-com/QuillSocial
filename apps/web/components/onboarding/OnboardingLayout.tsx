import React, { ReactNode } from "react";
import Head from "next/head";
import { OnboardingProgressHeader } from "./OnboardingProgressHeader";
import { OnboardingActionBar } from "./OnboardingActionBar";

type StepKey = 1 | 2 | 3;

interface OnboardingLayoutProps {
  currentStep: StepKey;
  statusLabel: string;
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children: ReactNode;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  currentStep,
  statusLabel,
  primaryAction,
  secondaryAction,
  children,
}) => {
  return (
    <div className="min-h-screen bg-muted pb-24">
      <Head>
        <title>Onboarding – QuillSocial</title>
        <meta name="description" content="Get started with QuillSocial in just 5 minutes" />
      </Head>

      <OnboardingProgressHeader currentStep={currentStep} />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {children}
      </main>

      <OnboardingActionBar
        statusLabel={statusLabel}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />
    </div>
  );
};
