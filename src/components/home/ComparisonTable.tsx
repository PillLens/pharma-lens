import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

export const ComparisonTable = () => {
  const features = [
    {
      category: 'Core Features',
      items: [
        { name: 'Medication scanning', free: true, premium: true, family: true },
        { name: 'Basic tracking', free: true, premium: true, family: true },
        { name: 'Scan history', free: '30 days', premium: 'Unlimited', family: 'Unlimited' },
        { name: 'Reminders', free: '3', premium: 'Unlimited', family: 'Unlimited' },
      ]
    },
    {
      category: 'Family & Sharing',
      items: [
        { name: 'Family members', free: false, premium: '5', family: 'Unlimited' },
        { name: 'Caregiver coordination', free: false, premium: false, family: true },
        { name: 'Healthcare provider sharing', free: false, premium: false, family: true },
        { name: 'Emergency contacts', free: false, premium: true, family: true },
      ]
    },
    {
      category: 'Advanced Features',
      items: [
        { name: 'Drug interaction checker', free: false, premium: true, family: true },
        { name: 'Advanced analytics', free: false, premium: true, family: true },
        { name: 'Export health reports', free: false, premium: true, family: true },
        { name: 'Voice assistant', free: false, premium: false, family: true },
      ]
    },
    {
      category: 'Support',
      items: [
        { name: 'Email support', free: true, premium: true, family: true },
        { name: 'Priority support', free: false, premium: true, family: true },
        { name: 'Dedicated account manager', free: false, premium: false, family: true },
      ]
    }
  ];

  const renderCell = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <div className="flex justify-center">
          <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="w-4 h-4 text-success" />
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <X className="w-4 h-4 text-muted-foreground/40" />
        </div>
      );
    }
    return (
      <div className="text-center text-sm font-medium text-foreground">
        {value}
      </div>
    );
  };

  return (
    <section className="mb-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Compare Plans
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Find the perfect plan for your medication management needs
        </p>
      </div>

      <Card className="overflow-hidden border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold text-foreground w-2/5">
                  Features
                </th>
                <th className="text-center p-4 font-semibold text-foreground w-1/5">
                  Free
                </th>
                <th className="text-center p-4 font-semibold text-primary w-1/5">
                  Premium
                </th>
                <th className="text-center p-4 font-semibold text-foreground w-1/5">
                  Family
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {features.map((category, categoryIndex) => (
                <>
                  {/* Category Header */}
                  <tr key={`category-${categoryIndex}`} className="bg-muted/20">
                    <td
                      colSpan={4}
                      className="p-3 font-semibold text-sm text-foreground"
                    >
                      {category.category}
                    </td>
                  </tr>

                  {/* Feature Rows */}
                  {category.items.map((item, itemIndex) => (
                    <tr
                      key={`item-${categoryIndex}-${itemIndex}`}
                      className="border-t border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-4 text-sm text-muted-foreground">
                        {item.name}
                      </td>
                      <td className="p-4">
                        {renderCell(item.free)}
                      </td>
                      <td className="p-4 bg-primary/5">
                        {renderCell(item.premium)}
                      </td>
                      <td className="p-4">
                        {renderCell(item.family)}
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
};
