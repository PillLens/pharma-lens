import { Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

const languages = [
  { code: "AZ", name: "Azərbaycan", flag: "🇦🇿" },
  { code: "EN", name: "English", flag: "🇬🇧" },
  { code: "RU", name: "Русский", flag: "🇷🇺" },
  { code: "TR", name: "Türkçe", flag: "🇹🇷" },
];

export const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => {
  const currentLanguage = languages.find(lang => lang.code === value) || languages[0];

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
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => onChange(language.code)}
            className={`gap-3 ${
              value === language.code ? "bg-primary-light text-primary" : ""
            }`}
          >
            <span className="text-lg">{language.flag}</span>
            <span>{language.name}</span>
            {value === language.code && (
              <div className="w-2 h-2 bg-primary rounded-full ml-auto"></div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};