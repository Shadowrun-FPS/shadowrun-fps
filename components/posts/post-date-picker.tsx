"use client";

import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const FIRST_YEAR = 2010;
const YEARS_AHEAD = 10;

interface CalendarWithDropdownsProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
}

function CalendarWithDropdowns({
  selected,
  onSelect,
}: CalendarWithDropdownsProps) {
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    selected || new Date()
  );

  useEffect(() => {
    if (selected) setVisibleMonth(selected);
  }, [selected]);

  const years = Array.from(
    { length: new Date().getFullYear() - FIRST_YEAR + YEARS_AHEAD + 1 },
    (_, index) => FIRST_YEAR + index
  );

  const shiftMonth = (offset: number) => {
    const next = new Date(visibleMonth);
    next.setMonth(next.getMonth() + offset);
    setVisibleMonth(next);
  };

  const handleMonthChange = (month: string) => {
    const next = new Date(visibleMonth);
    next.setMonth(Number(month));
    setVisibleMonth(next);
  };

  const handleYearChange = (year: string) => {
    const next = new Date(visibleMonth);
    next.setFullYear(Number(year));
    setVisibleMonth(next);
  };

  return (
    <div className="p-3">
      <div className="mb-4 flex flex-col items-stretch justify-between gap-2 border-b pb-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2">
          <Select
            value={visibleMonth.getMonth().toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="h-8 w-full text-sm sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((month, index) => (
                <SelectItem key={month} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={visibleMonth.getFullYear().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="h-8 w-full text-sm sm:w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
            type="button"
            title="Go to today"
            onClick={() => onSelect(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            type="button"
            title="Previous month"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            type="button"
            title="Next month"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        month={visibleMonth}
        onMonthChange={setVisibleMonth}
        initialFocus={false}
      />
    </div>
  );
}

interface PostDatePickerProps {
  id?: string;
  value: Date;
  onChange: (date: Date) => void;
}

/** Calendar-day picker with month and year dropdowns. */
export function PostDatePicker({ id, value, onChange }: PostDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "min-h-[44px] w-full justify-start border-2 text-left text-base font-normal touch-manipulation sm:min-h-[40px] sm:text-sm"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{format(value, "PPP")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 sm:min-w-[350px]" align="start">
        <CalendarWithDropdowns
          selected={value}
          onSelect={(date) => date && onChange(date)}
        />
      </PopoverContent>
    </Popover>
  );
}
