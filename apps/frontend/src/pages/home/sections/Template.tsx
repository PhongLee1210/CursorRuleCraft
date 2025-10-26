import { useMemo, useState } from 'react';

import { t } from '@lingui/macro';
import { Check, Copy, Download } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';

import { Badge } from '@frontend/components/Badge';
import { Button } from '@frontend/components/Button';
import { IconButton } from '@frontend/components/IconButton';
import { Input } from '@frontend/components/Input';
import { cursorRuleTemplates } from '@frontend/lib/utils';

const TemplateCard = ({
  template,
  index,
}: {
  template: (typeof cursorRuleTemplates)[0];
  index: number;
}) => {
  const [copied, setCopied] = useState(false);

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-card text-card-foreground rounded-lg border shadow-sm"
    >
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">{template.name}</h3>
        <div className="text-muted-foreground text-sm">
          {template.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 mr-1 border-transparent"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="p-6 pt-0">
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
          {template.content.trim()}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 p-6 pt-0">
        <div className="flex items-center gap-2">
          <IconButton
            onClick={handleCopy}
            icon={copied ? <Check size={16} /> : <Copy size={16} />}
            label={copied ? 'Copied' : 'Copy'}
          />
          <IconButton onClick={handleDownload} icon={<Download size={16} />} label="Download" />
        </div>
        <Link to={`/cursor/rules/${template.id}`}>
          <Button variant="default" size="sm">
            View Details
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export const TemplatesSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    cursorRuleTemplates.forEach((template) => {
      template.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, []);

  // Filter templates based on search and tags
  const filteredTemplates = useMemo(() => {
    return cursorRuleTemplates.filter((template) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Tag filter
      const matchesTags =
        selectedTags.length === 0 || selectedTags.some((tag) => template.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <section id="templates" className="relative w-full py-24 sm:py-32">
      <div className="container">
        <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">
          {t`Inspiring Cursor Rules Examples`}
        </h2>
        <p className="text-muted-foreground mb-8 text-center">
          {t`Explore these Cursor Rules examples to inspire your own custom AI rules. Remember, the most effective Cursor Rules are tailored to your specific project needs and coding requirements.`}
        </p>

        <div className="mb-6">
          <Input
            className="mb-4"
            placeholder="Search examples..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className={`cursor-pointer transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary/80'
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template, index) => (
            <TemplateCard key={template.id} template={template} index={index} />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-muted-foreground mt-8 text-center">
            {t`No templates found matching your search criteria.`}
          </div>
        )}

        <p className="text-muted-foreground mt-8 text-center">
          {t`For more Cursor Rules examples and inspiration, visit the`}
          <a
            className="text-primary ml-1 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            href="https://cursor.directory"
          >
            {t`Cursor Rules Directory`}
          </a>
        </p>
      </div>
    </section>
  );
};
