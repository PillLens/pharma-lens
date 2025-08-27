import { Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";

interface LanguageSelectorProps {
  value?: string;
  onChange?: (language: string) => void;
}

const languages = [
  { code: "EN", name: "English", flag: "🇬🇧" },
];

export const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => {
  const { language, changeLanguage } = useTranslation();
  const currentLanguageCode = value || language || 'AZ';
  const currentLanguage = languages.find(lang => lang.code === currentLanguageCode) || languages[0];

  const handleLanguageChange = (newLanguage: string) => {
    changeLanguage(newLanguage);
    onChange?.(newLanguage);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Globe2 className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
          <span className="sm:hidden">{currentLanguage.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`gap-3 ${
              currentLanguageCode === lang.code ? "bg-primary-light text-primary" : ""
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.name}</span>
            {currentLanguageCode === lang.code && (
              <div className="w-2 h-2 bg-primary rounded-full ml-auto"></div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};