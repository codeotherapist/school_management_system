"use client";

import {
  Calendar,
  momentLocalizer,
  Views,
  type View,
} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useState } from "react";

const localizer = momentLocalizer(moment);

const BigCalender = ({
  data,
}: {
  data: { title: string; start: Date; end: Date }[];
}) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  const [isMobile, setIsMobile] = useState(false);
  const [date, setDate] = useState<Date>(new Date());

  // 📱 Responsive view switching
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setView(mobile ? Views.DAY : Views.WORK_WEEK);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ⛔ Weekend helpers
  const isWeekend = (d: Date) => {
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const getNextWeekday = (d: Date, dir: "next" | "prev") => {
    let newDate = moment(d);

    do {
      newDate =
        dir === "next"
          ? newDate.add(1, "day")
          : newDate.subtract(1, "day");
    } while (isWeekend(newDate.toDate()));

    return newDate.toDate();
  };

  // 🔘 Day navigation (NO weekends)
  const goToNextDay = () =>
    setDate((prev) => getNextWeekday(prev, "next"));

  const goToPrevDay = () =>
    setDate((prev) => getNextWeekday(prev, "prev"));

  const goToToday = () => {
    let today = new Date();
    if (isWeekend(today)) {
      today = getNextWeekday(today, "next");
    }
    setDate(today);
  };

  return (
    <div className="h-full">
      {/* 🔘 Day Navigation (Mobile Only) */}
      {view === Views.DAY && (
        <div className="flex items-center justify-between mb-2 px-2">
          <button
            onClick={goToPrevDay}
            className="px-3 py-1 rounded bg-gray-200 text-sm"
          >
            ◀
          </button>

          <button
            onClick={goToToday}
            className="px-3 py-1 rounded bg-blue-500 text-white text-sm"
          >
            Today
          </button>

          <button
            onClick={goToNextDay}
            className="px-3 py-1 rounded bg-gray-200 text-sm"
          >
            ▶
          </button>
        </div>
      )}

      <Calendar
        localizer={localizer}
        events={data}
        startAccessor="start"
        endAccessor="end"
        views={isMobile ? [Views.DAY] : [Views.WORK_WEEK, Views.DAY]}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        dayLayoutAlgorithm="no-overlap"
        step={30}
        timeslots={1}
        style={{ height: "100%" }}
        min={new Date(2025, 0, 1, 8, 0)}
        max={new Date(2025, 0, 1, 20, 0)}
      />
    </div>
  );
};

export default BigCalender;
