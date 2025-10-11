import { useLingui } from '@lingui/react';
import { Helmet } from 'react-helmet-async';

import { SEO } from '@/components/SEO';

import { FAQSection } from './sections/FAQ';
import { FeaturesSection } from './sections/Features';
import { HeroSection } from './sections/Hero';
import { StatisticsSection } from './sections/Statistics';
import { TemplatesSection } from './sections/Template';

export const HomePage = () => {
  const { i18n } = useLingui();

  return (
    <main className="relative isolate">
      <Helmet prioritizeSeoTags>
        <html lang={i18n.locale} />
      </Helmet>

      <SEO
        description="A free and open-source cursor rules project builder that simplifies the process of creating, updating, and sharing your cursor rules."
        url="https://cursorrulescraft.com"
      />

      <HeroSection />
      <StatisticsSection />
      <FeaturesSection />
      <TemplatesSection />
      <FAQSection />
    </main>
  );
};
