import type { LucideIcon } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

const toneStyles: Record<string, string> = {
  muted:
    'border-border/60 bg-gradient-to-br from-card to-muted/30 text-foreground',
  primary:
    'border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 text-primary',
  secondary:
    'border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/5 text-secondary',
  accent:
    'border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 text-accent',
};

export interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: 'muted' | 'primary' | 'secondary' | 'accent';
}

export function StatCard({ label, value, icon: Icon, tone }: StatCardProps) {
  return (
    <Card className={`${toneStyles[tone]} shadow-sm`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-semibold uppercase tracking-wider">
            {label}
          </CardDescription>
          <Icon className="h-4 w-4 opacity-70" />
        </div>
        <CardTitle className="mt-2 text-3xl font-bold">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
