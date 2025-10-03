import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MedicationSearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: SearchFilters) => void;
  className?: string;
  placeholder?: string;
}

export interface SearchFilters {
  active?: boolean;
  inactive?: boolean;
  due?: boolean;
  expired?: boolean;
}

export const MedicationSearchBar: React.FC<MedicationSearchBarProps> = ({
  onSearch,
  onFilterChange,
  className,
  placeholder = 'Search medications...'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const toggleFilter = (key: keyof SearchFilters) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-12 rounded-xl border-border/50 focus:border-primary"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-4 rounded-xl border-border/50 relative"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge 
                variant="default" 
                className="ml-2 h-5 min-w-5 px-1.5 rounded-full text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuCheckboxItem
            checked={filters.active}
            onCheckedChange={() => toggleFilter('active')}
          >
            Active Only
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.inactive}
            onCheckedChange={() => toggleFilter('inactive')}
          >
            Inactive Only
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.due}
            onCheckedChange={() => toggleFilter('due')}
          >
            Due Now
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.expired}
            onCheckedChange={() => toggleFilter('expired')}
          >
            Expired
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
