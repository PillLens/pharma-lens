import { useState } from "react";
import { Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string;
  onComplete: () => void;
}

export const FeedbackDialog = ({ open, onOpenChange, sessionId, onComplete }: FeedbackDialogProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [issueType, setIssueType] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleStarHover = (value: number) => {
    setHoveredRating(value);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('submit-feedback', {
        body: {
          rating,
          issue_type: issueType || null,
          comment: comment.trim() || null,
          session_id: sessionId || null,
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! It helps us improve the app.",
      });

      // Reset form
      setRating(0);
      setHoveredRating(0);
      setIssueType("");
      setComment("");
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const issueOptions = [
    { value: "accuracy", label: "Incorrect medication information" },
    { value: "quality", label: "Poor image recognition" },
    { value: "performance", label: "App is slow or unresponsive" },
    { value: "missing", label: "Missing medication in database" },
    { value: "interface", label: "Confusing interface or navigation" },
    { value: "other", label: "Other issue" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            How was your experience?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rate your experience</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleStarClick(value)}
                  onMouseEnter={() => handleStarHover(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      value <= (hoveredRating || rating)
                        ? "fill-warning text-warning"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Issue Type (only if rating is low) */}
          {rating > 0 && rating <= 3 && (
            <div className="space-y-3">
              <Label>What went wrong? (Optional)</Label>
              <RadioGroup value={issueType} onValueChange={setIssueType}>
                {issueOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label 
                      htmlFor={option.value} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comment">
              Additional comments (Optional)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              className="min-h-[80px]"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="flex-1"
            >
              {isSubmitting ? t('feedback.submitting') : t('feedback.submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};