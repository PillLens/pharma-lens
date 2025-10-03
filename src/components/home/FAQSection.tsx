import { Card } from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How accurate is the medication scanner?',
    answer: 'Our AI-powered scanner achieves 99.2% accuracy by using advanced OCR technology and cross-referencing with FDA-approved medication databases. We continuously update our system to maintain the highest accuracy standards.'
  },
  {
    question: 'Is my health data secure and private?',
    answer: 'Absolutely. We use bank-level encryption and are HIPAA compliant. Your health data is stored securely and never shared with third parties without your explicit permission. All scans are processed securely on our servers.'
  },
  {
    question: 'Can I manage medications for my family members?',
    answer: 'Yes! With our Family Plan, you can create family groups, share medication schedules, set reminders for loved ones, and coordinate care with other family members or caregivers.'
  },
  {
    question: 'What if the app can\'t identify my medication?',
    answer: 'If automatic identification fails, you can manually enter the medication details or contact our support team. We continuously improve our database and may add your medication for future users.'
  },
  {
    question: 'Do I need an internet connection to use the app?',
    answer: 'While scanning and identification require internet connectivity, you can view your saved medications and reminders offline. The app will sync when you reconnect to the internet.'
  },
  {
    question: 'How do medication reminders work?',
    answer: 'Set custom reminders based on your prescription schedule. You\'ll receive push notifications at the right time. You can mark doses as taken, skip, or snooze reminders as needed.'
  }
];

export const FAQSection = () => {
  return (
    <section className="mb-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <HelpCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Frequently Asked Questions</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Got Questions? We've Got Answers
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Everything you need to know about PillLens and medication management
        </p>
      </div>

      <Card className="max-w-4xl mx-auto p-6 md:p-8 border-border/50">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </section>
  );
};
