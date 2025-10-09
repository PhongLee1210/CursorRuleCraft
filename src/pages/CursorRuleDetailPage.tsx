import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { cursorRuleTemplates } from '@/lib/utils';
import { t } from '@lingui/macro';
import { ArrowLeft, Check, Copy, Download } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';

export const CursorRuleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const template = cursorRuleTemplates.find((t) => t.id === id);

  if (!template) {
    return <Navigate to="/" replace />;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(template.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([template.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}.cursorrules`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back Button */}
          <Link to="/#templates">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft />
              {t`Back to Templates`}
            </Button>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold sm:text-4xl">{template.name}</h1>
                <p className="text-muted-foreground text-lg">{template.description}</p>
              </div>
              <Badge variant="secondary" className="shrink-0 px-4 py-1 text-sm">
                {template.category}
              </Badge>
            </div>

            {/* Tags */}
            <div className="mb-6 flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="border-transparent bg-secondary text-secondary-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleCopy} variant="default" size="lg">
                {copied ? (
                  <>
                    <Check weight="bold" />
                    {t`Copied!`}
                  </>
                ) : (
                  <>
                    <Copy weight="bold" />
                    {t`Copy Rule`}
                  </>
                )}
              </Button>
              <Button onClick={handleDownload} variant="outline" size="lg">
                <Download weight="bold" />
                {t`Download as .cursorrules`}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold">{t`Rule Content`}</h2>
              <div className="bg-muted overflow-x-auto rounded-md p-6">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  <code className="text-foreground">{template.content}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-card mt-8 rounded-lg border shadow-sm">
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold">{t`How to Use`}</h2>
              <ol className="text-muted-foreground list-inside list-decimal space-y-3">
                <li>{t`Copy the rule content above or download it as a .cursorrules file`}</li>
                <li>{t`Open your project in Cursor IDE`}</li>
                <li>
                  {t`Create a new file named`} <code className="text-foreground">.cursorrules</code>{' '}
                  {t`in your project root`}
                </li>
                <li>{t`Paste the rule content into the file`}</li>
                <li>{t`Save the file and Cursor will automatically apply these rules to your project`}</li>
              </ol>
            </div>
          </div>

          {/* Related Templates */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">{t`Related Templates`}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cursorRuleTemplates
                .filter(
                  (t) =>
                    t.id !== template.id &&
                    (t.category === template.category ||
                      t.tags.some((tag) => template.tags.includes(tag)))
                )
                .slice(0, 3)
                .map((relatedTemplate) => (
                  <Link
                    key={relatedTemplate.id}
                    to={`/cursor/rules/${relatedTemplate.id}`}
                    className="block"
                  >
                    <div className="bg-card rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md">
                      <h3 className="mb-2 font-semibold">{relatedTemplate.name}</h3>
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {relatedTemplate.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {relatedTemplate.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="border-transparent bg-secondary/50 text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
