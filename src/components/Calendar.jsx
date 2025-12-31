import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Calendar = ({ selectedDate, onDateSelect, markedDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = monthStart.getDay();
  const daysBeforeMonth = Array(firstDayOfWeek).fill(null);

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isMarked = (date) => {
    return markedDates.some(markedDate => isSameDay(date, markedDate));
  };

  const isSelected = (date) => {
    return selectedDate && isSameDay(date, new Date(selectedDate));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <button onClick={goToPreviousMonth} className="calendar-nav-btn">
          <FiChevronLeft size={18} />
        </button>
        <h3 className="calendar-month-year">
          {format(currentMonth, 'MMM yyyy')}
        </h3>
        <button onClick={goToNextMonth} className="calendar-nav-btn">
          <FiChevronRight size={18} />
        </button>
      </div>
      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>
      <div className="calendar-days">
        {daysBeforeMonth.map((_, index) => (
          <div key={`empty-${index}`} className="calendar-day empty"></div>
        ))}
        {daysInMonth.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          return (
            <button
              key={dayStr}
              className={`calendar-day ${isSelected(dayStr) ? 'selected' : ''} ${isMarked(day) ? 'marked' : ''}`}
              onClick={() => onDateSelect && onDateSelect(dayStr)}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;




