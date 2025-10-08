import { t } from '@lingui/macro';

import { animate, motion, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

type CounterProps = { from: number; to: number };

export const Counter = ({ from, to }: CounterProps) => {
  const nodeRef = useRef<HTMLParagraphElement | null>(null);
  const isInView = useInView(nodeRef, { once: true });

  useEffect(() => {
    const node = nodeRef.current;

    if (!isInView || !node) return;

    const controls = animate(from, to, {
      duration: 1,
      onUpdate(value) {
        node.textContent = Math.round(value).toLocaleString();
      },
    });

    return () => {
      controls.stop();
    };
  }, [from, to, isInView]);

  return (
    <motion.span
      ref={nodeRef}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      initial={{ opacity: 0, scale: 0.1 }}
      whileInView={{ opacity: 1, scale: 1 }}
    />
  );
};

type Statistic = {
  name: string;
  value: number;
};

export const StatisticsSection = () => {
  const stats: Statistic[] = [
    { name: t`GitHub Stars`, value: 1 },
    { name: t`Users Signed Up`, value: 1 },
    { name: t`Rules Generated`, value: 1 },
  ];

  return (
    <section id="statistics" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
          {stats.map((stat, index) => (
            <div key={index} className="mx-auto flex max-w-xs flex-col gap-y-3">
              <dt className="text-base leading-7 opacity-60">{stat.name}</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight sm:text-5xl">
                <Counter from={0} to={stat.value} />+
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
