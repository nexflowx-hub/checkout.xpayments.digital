"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, LOCALE_NAMES, type Locale } from "@/lib/i18n";

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="text-xs font-medium uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {(Object.entries(LOCALE_NAMES) as [Locale, string][]).map(
          ([code, name]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => setLocale(code)}
              className={code === locale ? "bg-accent" : ""}
            >
              <span className="text-xs font-medium uppercase mr-2 w-5 text-center">
                {code}
              </span>
              <span className="text-sm">{name}</span>
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}