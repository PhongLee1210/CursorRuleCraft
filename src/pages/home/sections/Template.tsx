import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { cursorRuleTemplates } from '@/lib/utils';
import { t } from '@lingui/macro';
import { motion } from 'framer-motion';
import { useState } from 'react';

const TemplateCard = ({
  template,
  index,
}: {
  template: (typeof cursorRuleTemplates)[0];
  index: number;
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(template.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedContent =
    template.content.length > 200 ? template.content.slice(0, 200) + '...' : template.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-card group relative rounded-lg border p-6 shadow-sm transition-all hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{template.name}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{template.description}</p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {template.category}
        </Badge>
      </div>

      <div className="mb-4">
        <pre className="bg-muted max-h-[200px] overflow-hidden rounded-md p-4 text-xs leading-relaxed">
          <code className="text-foreground/80">
            {expanded ? template.content : truncatedContent}
          </code>
        </pre>
        {template.content.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs text-primary hover:underline"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleCopy} variant="default" className="w-full">
          {copied ? (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              Copy Rule
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export const TemplatesSection = () => (
  <section id="templates" className="relative py-24 sm:py-32">
    <div className="container">
      <div className="mb-12 space-y-4 text-center">
        <h2 className="text-4xl font-bold">{t`Cursor Rules Templates`}</h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed">
          {t`Browse our collection of ready-to-use cursor rules templates. Copy and paste them into your project to get started quickly with best practices.`}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cursorRuleTemplates.map((template, index) => (
          <TemplateCard key={template.id} template={template} index={index} />
        ))}
      </div>
    </div>
  </section>
);
