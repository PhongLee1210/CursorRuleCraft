import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/Accordion';

const Question1 = () => (
  <AccordionItem value="1">
    <AccordionTrigger className="text-left leading-relaxed">
      Who are you, and why did you build CursorRulesCraft?
    </AccordionTrigger>
    <AccordionContent className="prose dark:prose-invert max-w-none">
      <p>
        I'm Phong Lee, a Software Engineer on my journey to becoming an AI Engineer. I'm passionate
        about leveraging AI to enhance developer productivity and streamline workflows.
      </p>

      <p>
        As I started using Cursor AI more frequently in my development work, I noticed that creating
        and managing custom .cursorrules files was becoming a common pain point. Many developers
        were either unaware of how powerful custom rules could be, or they found it tedious to craft
        and maintain them.
      </p>

      <p>
        I decided to build CursorRulesCraft to solve this problem. Instead of manually writing rules
        from scratch or copying and pasting from various sources, developers can now use this tool
        to generate, customize, and manage their Cursor rules efficiently.
      </p>

      <p>
        The goal is to help developers get the most out of Cursor AI by providing them with
        well-structured, context-aware rules that enhance their coding experience. Whether you're
        working on React, Python, or any other tech stack, CursorRulesCraft helps you create rules
        that align with your specific needs and coding style.
      </p>

      <p>
        My dream is to build tools that empower developers to work smarter, not harder. If
        CursorRulesCraft helps even a handful of developers improve their workflow, I'll consider it
        a success.
      </p>
    </AccordionContent>
  </AccordionItem>
);

// Is CursorRulesCraft free to use?
const Question2 = () => (
  <AccordionItem value="2">
    <AccordionTrigger className="text-left leading-relaxed">
      Is CursorRulesCraft free to use?
    </AccordionTrigger>
    <AccordionContent className="prose dark:prose-invert max-w-none">
      <p>
        Yes! CursorRulesCraft is completely free and open-source. My goal is to help developers
        enhance their productivity with Cursor AI, and putting it behind a paywall would defeat that
        purpose.
      </p>

      <p>
        The application runs entirely in your browser, so there are no server costs for generating
        rules. You can use it as much as you want, export your rules, and share them with your team
        without any limitations.
      </p>

      <p>
        I've built this tool in my spare time as part of my journey into AI engineering. If you find
        it helpful and want to support future development, you can star the project on GitHub, share
        it with fellow developers, or contribute to the codebase.
      </p>

      <p>
        Your feedback is the most valuable thing you can give. If CursorRulesCraft has improved your
        development workflow, let me know! It motivates me to keep building and improving the tool.
      </p>
    </AccordionContent>
  </AccordionItem>
);

// How can I contribute or support the project?
const Question3 = () => (
  <AccordionItem value="3">
    <AccordionTrigger className="text-left leading-relaxed">
      How can I contribute or support the project?
    </AccordionTrigger>
    <AccordionContent className="prose dark:prose-invert max-w-none">
      <p>
        <strong>If you're a developer</strong>, contributions are always welcome! You can fork the
        repository on GitHub, make improvements, add new rule templates, or fix bugs. Pull requests
        are reviewed regularly, and I'm always excited to see what the community builds.
      </p>

      <p>
        <strong>If you have a great rule template</strong>, share it with the community! The more
        diverse our rule templates are, the more helpful CursorRulesCraft becomes for developers
        across different tech stacks and use cases. You can submit your templates via GitHub issues
        or pull requests.
      </p>

      <p>
        <strong>If you're active in developer communities</strong>, spread the word! Share
        CursorRulesCraft with your team, post about it on social media, or mention it in your blog.
        The more developers who know about it, the more we can help the community improve their AI
        coding workflows.
      </p>

      <p>
        <strong>If you found a bug or have a feature request</strong>, please open an issue on
        GitHub. I'm juggling work, learning AI engineering, and open-source development, but I'll do
        my best to respond and implement improvements as time allows.
      </p>
    </AccordionContent>
  </AccordionItem>
);

// What types of rules can I generate with CursorRulesCraft?
const Question4 = () => (
  <AccordionItem value="4">
    <AccordionTrigger className="text-left leading-relaxed">
      What types of rules can I generate with CursorRulesCraft?
    </AccordionTrigger>
    <AccordionContent className="prose dark:prose-invert max-w-none">
      <p>
        CursorRulesCraft supports a wide variety of rule templates for different frameworks,
        languages, and coding practices. Here are some of the categories available:
      </p>

      <div className="flex flex-wrap items-start justify-start gap-2">
        <span className="bg-primary/10 rounded-md px-3 py-1.5 text-sm font-medium">React</span>
        <span className="bg-primary/10 rounded-md px-3 py-1.5 text-sm font-medium">Next.js</span>
        <span className="bg-primary/10 rounded-md px-3 py-1.5 text-sm font-medium">Vue</span>
        <span className="bg-primary/10 rounded-md px-3 py-1.5 text-sm font-medium">TypeScript</span>
        <span className="bg-primary/10 rounded-md px-3 py-1.5 text-sm font-medium">Python</span>
        <span className="bg-primary/10 rounded-md px-3 py-1.5 text-sm font-medium">Node.js</span>
        <span className="bg-primary/10 rounded-md px-3 py-1.5 text-sm font-medium">
          TailwindCSS
        </span>
        <span className="bg-primary/10 rounded-md px-3 py-1.5 text-sm font-medium">Testing</span>
        <span className="bg-primary/10 rounded-md px-3 py-1.5 text-sm font-medium">
          API Development
        </span>
        <span className="bg-primary/10 rounded-md px-3 py-1.5 text-sm font-medium">Clean Code</span>
        <span className="bg-primary/10 rounded-md px-3 py-1.5 text-sm font-medium">Security</span>
        <span className="bg-primary/10 rounded-md px-3 py-1.5 text-sm font-medium">
          Performance
        </span>
      </div>

      <p>
        You can also create custom rules from scratch or modify existing templates to fit your
        specific project needs. The builder allows you to combine multiple rule sets, adjust
        priorities, and customize every aspect of how Cursor AI understands your codebase.
      </p>

      <p>
        If you have a rule template that you think would benefit others, please contribute it to the
        project! I'm always looking to expand the library with community-driven templates.
      </p>
    </AccordionContent>
  </AccordionItem>
);

// What are best practices for using Cursor rules?
const Question5 = () => (
  <AccordionItem value="5">
    <AccordionTrigger className="text-left leading-relaxed">
      What are best practices for using Cursor rules?
    </AccordionTrigger>
    <AccordionContent className="prose dark:prose-invert max-w-none">
      <p>
        Cursor rules are incredibly powerful for guiding AI behavior in your projects. Here are some
        tips to get the most out of them:
      </p>

      <p>
        <strong>Start specific, then generalize.</strong> Begin with rules that address your
        project's unique needs—naming conventions, architecture patterns, or technology stack
        preferences. Generic rules work well, but specific context helps Cursor AI understand your
        codebase better.
      </p>

      <p>
        <strong>Keep rules organized and documented.</strong> Use clear section headers and comments
        in your .cursorrules file. This makes it easier to maintain and update as your project
        evolves. CursorRulesCraft helps with this by providing structured templates.
      </p>

      <p>
        <strong>Test and iterate.</strong> After applying new rules, observe how Cursor AI responds
        to your prompts. If the AI isn't following certain guidelines, refine your rules to be more
        explicit. Rules are meant to be refined over time based on your experience.
      </p>

      <p>
        <strong>Don't over-constrain.</strong> While detailed rules are helpful, leaving some room
        for the AI's creativity can lead to better solutions. Balance guidance with flexibility.
      </p>

      <p>
        Remember, the goal is to make Cursor AI a better pair programmer for your specific needs.
        Experiment, adjust, and find what works best for your workflow!
      </p>
    </AccordionContent>
  </AccordionItem>
);

export const FAQSection = () => (
  <section id="faq" className="container relative py-24 sm:py-32">
    <div className="grid gap-12 lg:grid-cols-3">
      <div className="space-y-6">
        <h2 className="text-4xl font-bold">Frequently Asked Questions</h2>

        <p className="text-base leading-loose">
          Here are some common questions about CursorRulesCraft and how to make the most of your
          Cursor AI rules.
        </p>

        <p className="text-muted-foreground text-sm leading-loose">
          Have a question that's not answered here? Feel free to reach out or open an issue on
          GitHub.
        </p>
      </div>

      <div className="col-span-2">
        <Accordion collapsible type="single">
          <Question1 />
          <Question2 />
          <Question3 />
          <Question4 />
          <Question5 />
        </Accordion>
      </div>
    </div>
  </section>
);
