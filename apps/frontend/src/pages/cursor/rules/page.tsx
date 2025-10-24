import { Badge } from "@frontend/components/Badge";
import { Button } from "@frontend/components/Button";
import { cursorRuleTemplates } from "@frontend/lib/utils";
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

  // Create Cursor deeplink URL with encoded prompt
  const cursorDeeplinkUrl = `cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(template.content)}`;

  const handleAddToCursor = () => {
    window.open(cursorDeeplinkUrl, '_blank');
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto mt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="py-8"
        >
          {/* Back Button */}
          <Link
            to="/#templates"
            className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            {t`Back to Templates`}
          </Link>

          {/* Header with Logo/Icon */}
          <div className="mb-6 flex items-center gap-4">
            <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-lg">
              <span className="text-2xl font-bold">{template.name.charAt(0)}</span>
            </div>
            <div className="flex w-full items-center justify-between gap-2">
              <h1 className="text-2xl font-semibold">{template.name}</h1>
              <Badge variant="secondary" className="shrink-0">
                {template.category}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <p className="mb-4 leading-relaxed text-[#878787]">
            {t`A comprehensive cursor rule template for ${template.name}. This rule helps you maintain consistency and best practices in your project.`}
          </p>

          {/* Tags */}
          <div className="mb-6 flex flex-wrap gap-2">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="secondary" outline className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Add to Cursor Button */}
          <div className="mb-8 flex flex-wrap gap-3">
            <Button onClick={handleAddToCursor} variant="default" size="lg" className="gap-2">
              <Download weight="bold" size={18} />
              {t`Add to Cursor`}
            </Button>
            <Button onClick={handleCopy} variant="outline" size="lg" className="gap-2">
              {copied ? (
                <>
                  <Check weight="bold" size={18} />
                  {t`Copied!`}
                </>
              ) : (
                <>
                  <Copy weight="bold" size={18} />
                  {t`Copy Rule`}
                </>
              )}
            </Button>
            <Button onClick={handleDownload} variant="ghost" size="lg" className="gap-2">
              <Download weight="bold" size={18} />
              {t`.cursorrules`}
            </Button>
          </div>

          {/* Rule Content Preview */}
          <div className="bg-card mb-8 overflow-hidden rounded-lg border">
            <div className="bg-muted/50 border-b px-4 py-3">
              <h2 className="text-sm font-medium">{t`Rule Content`}</h2>
            </div>
            <div className="overflow-x-auto p-4">
              <pre className="text-sm leading-relaxed text-[#878787]">
                <code>{template.content}</code>
              </pre>
            </div>
          </div>

          {/* How to Use Section */}
          <div className="border-border my-8 rounded-lg border-2 border-dashed p-6">
            <h1 className="mb-6 text-2xl">{t`How to Use Cursor Rules`}</h1>

            <section className="mb-6">
              <h2 className="mb-3 text-xl">{t`What are Cursor Rules?`}</h2>
              <p className="text-[#878787]">
                {t`Cursor Rules are instructions that help AI understand your project's context, coding standards, and preferences. They ensure consistent and high-quality code generation.`}
              </p>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-xl">{t`Installation Methods`}</h2>
              <ol className="list-inside list-decimal space-y-2">
                <li className="text-[#878787]">
                  <span className="text-foreground font-medium">{t`Quick Install (Recommended)`}</span>
                  <ul className="ml-6 mt-1 list-disc space-y-1">
                    <li>{t`Click the "Add to Cursor" button above`}</li>
                    <li>{t`Cursor will open with the rule content ready to use`}</li>
                    <li>{t`Save it as a .cursorrules file in your project`}</li>
                  </ul>
                </li>
                <li className="text-[#878787]">
                  <span className="text-foreground font-medium">{t`Manual Installation`}</span>
                  <ul className="ml-6 mt-1 list-disc space-y-1">
                    <li>{t`Copy the rule content or download the .cursorrules file`}</li>
                    <li>{t`Open your project in Cursor IDE`}</li>
                    <li>
                      {t`Create a new file named`}{' '}
                      <code className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-sm">
                        .cursorrules
                      </code>{' '}
                      {t`in your project root`}
                    </li>
                    <li>{t`Paste the rule content and save`}</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section className="mb-6">
              <h2 className="mb-3 text-xl">{t`Using the Rules`}</h2>
              <ol className="list-inside list-decimal space-y-2">
                <li className="text-[#878787]">
                  <span className="text-foreground font-medium">{t`Automatic Application`}</span>
                  <ul className="ml-6 mt-1 list-disc">
                    <li>{t`Once saved, Cursor automatically applies these rules to all AI interactions in your project`}</li>
                  </ul>
                </li>
                <li className="text-[#878787]">
                  <span className="text-foreground font-medium">{t`Customization`}</span>
                  <ul className="ml-6 mt-1 list-disc">
                    <li>{t`Feel free to modify the rules to match your specific needs`}</li>
                    <li>{t`Add project-specific guidelines and conventions`}</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="mb-3 text-xl">{t`Important Notes`}</h2>
              <ul className="list-inside list-disc space-y-2 text-[#878787]">
                <li>{t`Rules apply to the entire project directory where the .cursorrules file is located`}</li>
                <li>{t`You can have multiple .cursorrules files in different directories for fine-grained control`}</li>
                <li>{t`Changes to .cursorrules take effect immediately`}</li>
              </ul>
            </section>
          </div>

          {/* Related Templates */}
          {cursorRuleTemplates.filter(
            (t) =>
              t.id !== template.id &&
              (t.category === template.category ||
                t.tags.some((tag) => template.tags.includes(tag)))
          ).length > 0 && (
            <div className="mt-12">
              <h2 className="mb-4 text-xl font-semibold">{t`Related Templates`}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {cursorRuleTemplates
                  .filter(
                    (t) =>
                      t.id !== template.id &&
                      (t.category === template.category ||
                        t.tags.some((tag) => template.tags.includes(tag)))
                  )
                  .slice(0, 4)
                  .map((relatedTemplate) => (
                    <Link
                      key={relatedTemplate.id}
                      to={`/cursor/rules/${relatedTemplate.id}`}
                      className="block"
                    >
                      <div className="bg-card hover:border-primary/50 group rounded-lg border p-4 transition-all hover:shadow-md">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="group-hover:text-primary font-semibold transition-colors">
                            {relatedTemplate.name}
                          </h3>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {relatedTemplate.category}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {relatedTemplate.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" outline className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
