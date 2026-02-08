import { useTranslations } from 'next-intl';

import { Background } from '@/components/Background';
import { YouTubeCaptionExtractor } from '@/components/YouTubeCaptionExtractor';
import { FeatureCard } from '@/features/landing/FeatureCard';
import { Section } from '@/features/landing/Section';

export const Features = () => {
  const t = useTranslations('Features');

  return (
    <Background>
      <Section
        subtitle={t('section_subtitle')}
        title={t('section_title')}
        description={t('section_description')}
      >
        <div className="grid grid-cols-1 gap-x-3 gap-y-8 md:grid-cols-3">
          <FeatureCard
            icon={(
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
            title="Smart Analytics"
          >
            Get detailed insights into your video performance with advanced analytics and real-time metrics.
          </FeatureCard>

          <FeatureCard
            icon={(
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            )}
            title="Easy Integration"
          >
            Seamlessly integrate with your existing workflow with our simple API and comprehensive documentation.
          </FeatureCard>

          <FeatureCard
            icon={(
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              </svg>
            )}
            title="Enterprise Security"
          >
            Bank-grade security with end-to-end encryption and compliance with industry standards.
          </FeatureCard>
        </div>

        <div className="mt-12">
          <YouTubeCaptionExtractor />
        </div>
      </Section>
    </Background>
  );
};
