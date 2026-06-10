"use client";

import { useState } from "react";
import { GlobalCalendarView } from "@/components/calendar/GlobalCalendarView";

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  return (
    <div className="p-6 ">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-[#111]">Calendário Global</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="text-xs border border-[#e5e5e5] rounded-lg px-2 py-1.5 bg-white"
        />
      </div>
      <GlobalCalendarView month={month} />
    </div>
  );
}
