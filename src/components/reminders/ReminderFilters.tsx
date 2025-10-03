import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, SlidersHorizontal, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';

export interface ReminderFilterState {
  searchQuery: string;
  status: 'all' | 'active' | 'paused';
  sortBy: 'name' | 'time' | 'adherence' | 'created';
  sortOrder: 'asc' | 'desc';
  timeRange: 'all' | 'today' | 'upcoming' | 'overdue';
}

interface ReminderFiltersProps {
  filters: ReminderFilterState;
  onFiltersChange: (filters: ReminderFilterState) => void;
  resultCount?: number;
}

const ReminderFilters: React.FC<ReminderFiltersProps> = ({
  filters,
  onFiltersChange,
  resultCount
}) => {
  const { t } = useTranslation();
  const [localSearch, setLocalSearch] = useState(filters.searchQuery);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.searchQuery) {
        onFiltersChange({ ...filters, searchQuery: localSearch });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, filters, onFiltersChange]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
  };

  const clearSearch = () => {
    setLocalSearch('');
    onFiltersChange({ ...filters, searchQuery: '' });
  };

  const handleStatusChange = (status: ReminderFilterState['status']) => {
    onFiltersChange({ ...filters, status });
  };

  const handleSortChange = (sortBy: ReminderFilterState['sortBy']) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const handleSortOrderToggle = () => {
    onFiltersChange({ 
      ...filters, 
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
    });
  };

  const handleTimeRangeChange = (timeRange: ReminderFilterState['timeRange']) => {
    onFiltersChange({ ...filters, timeRange });
  };

  const resetFilters = () => {
    const defaultFilters: ReminderFilterState = {
      searchQuery: '',
      status: 'all',
      sortBy: 'time',
      sortOrder: 'asc',
      timeRange: 'all'
    };
    setLocalSearch('');
    onFiltersChange(defaultFilters);
    setIsFilterSheetOpen(false);
  };

  const activeFilterCount = [
    filters.status !== 'all',
    filters.timeRange !== 'all',
    filters.sortBy !== 'time',
    filters.searchQuery.length > 0
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('reminders.filters.searchPlaceholder') || 'Search medications...'}
          className="pl-10 pr-10 rounded-xl"
        />
        {localSearch && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Quick Filters & Advanced Filter Button */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status Quick Filters */}
        <Badge
          variant={filters.status === 'all' ? 'default' : 'outline'}
          className="cursor-pointer px-3 py-1.5 rounded-full"
          onClick={() => handleStatusChange('all')}
        >
          All
        </Badge>
        <Badge
          variant={filters.status === 'active' ? 'default' : 'outline'}
          className="cursor-pointer px-3 py-1.5 rounded-full"
          onClick={() => handleStatusChange('active')}
        >
          Active
        </Badge>
        <Badge
          variant={filters.status === 'paused' ? 'default' : 'outline'}
          className="cursor-pointer px-3 py-1.5 rounded-full"
          onClick={() => handleStatusChange('paused')}
        >
          Paused
        </Badge>

        {/* Time Range Quick Filters */}
        <Badge
          variant={filters.timeRange === 'today' ? 'default' : 'outline'}
          className="cursor-pointer px-3 py-1.5 rounded-full"
          onClick={() => handleTimeRangeChange('today')}
        >
          <Clock className="w-3 h-3 mr-1" />
          Today
        </Badge>
        <Badge
          variant={filters.timeRange === 'upcoming' ? 'default' : 'outline'}
          className="cursor-pointer px-3 py-1.5 rounded-full"
          onClick={() => handleTimeRangeChange('upcoming')}
        >
          Upcoming
        </Badge>

        {/* Advanced Filters Sheet Trigger */}
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full ml-auto">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Advanced Filters
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-6">
              {/* Sort By */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time</SelectItem>
                    <SelectItem value="name">Medication Name</SelectItem>
                    <SelectItem value="adherence">Adherence Rate</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <div className="flex gap-2">
                  <Badge
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-2 rounded-xl flex-1 justify-center"
                    onClick={() => onFiltersChange({ ...filters, sortOrder: 'asc' })}
                  >
                    Ascending
                  </Badge>
                  <Badge
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-2 rounded-xl flex-1 justify-center"
                    onClick={() => onFiltersChange({ ...filters, sortOrder: 'desc' })}
                  >
                    Descending
                  </Badge>
                </div>
              </div>

              {/* Time Range */}
              <div className="space-y-2">
                <Label>Time Range</Label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'today', 'upcoming', 'overdue'] as const).map((range) => (
                    <Badge
                      key={range}
                      variant={filters.timeRange === range ? 'default' : 'outline'}
                      className="cursor-pointer px-4 py-2 rounded-xl capitalize"
                      onClick={() => handleTimeRangeChange(range)}
                    >
                      {range}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="flex-1 rounded-xl"
                >
                  Reset All
                </Button>
                <Button
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="flex-1 rounded-xl"
                >
                  Apply
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {resultCount} {resultCount === 1 ? 'reminder' : 'reminders'} found
        </div>
      )}
    </div>
  );
};

export default ReminderFilters;
