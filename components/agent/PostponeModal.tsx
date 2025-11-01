"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, MapPin, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, isAfter, startOfDay, isToday, isTomorrow, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { useState, useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onPostpone: (dispatchDate: Date) => void;
  orderId: string;
  customerName: string;
  loading?: boolean;
};

export function PostponeModal({ 
  open, 
  onClose, 
  onPostpone, 
  orderId,
  customerName,
  loading = false 
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Reset selected date when modal opens
  useEffect(() => {
    if (open) {
      setSelectedDate(undefined);
      setCalendarOpen(false);
      setCurrentMonth(new Date());
    }
  }, [open]);

  const handlePostpone = () => {
    if (selectedDate && isDateValid) {
      onPostpone(selectedDate);
    }
  };

  const isDateValid = selectedDate && isAfter(selectedDate, startOfDay(new Date()));
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  // Custom Calendar Component
  const CustomCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfMonth(monthStart);
    const endDate = endOfMonth(monthEnd);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const startOfWeek = startDate.getDay();
    const emptyDays = Array.from({ length: startOfWeek }, (_, i) => i);

    const handleDateClick = (date: Date) => {
      if (date >= startOfDay(new Date())) {
        setSelectedDate(date);
        setCalendarOpen(false);
      }
    };

    const isDateDisabled = (date: Date) => {
      return date < startOfDay(new Date());
    };

    const isDateSelected = (date: Date) => {
      return selectedDate && isSameDay(date, selectedDate);
    };

    const isToday = (date: Date) => {
      return isSameDay(date, new Date());
    };

    return (
      <div className="bg-white rounded-2xl p-4 shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty days for start of month */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="h-9" />
          ))}
          
          {/* Days */}
          {days.map((day) => {
            const disabled = isDateDisabled(day);
            const selected = isDateSelected(day);
            const today = isToday(day);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                disabled={disabled}
                className={`
                  h-9 w-9 rounded-lg text-sm font-medium transition-all duration-200
                  ${disabled 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'hover:bg-blue-100 cursor-pointer'
                  }
                  ${selected 
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg' 
                    : ''
                  }
                  ${today && !selected 
                    ? 'bg-gray-100 text-gray-900 font-semibold' 
                    : ''
                  }
                  ${!disabled && !selected && !today 
                    ? 'text-gray-700 hover:bg-blue-50' 
                    : ''
                  }
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div 
            className="w-full max-w-2xl mx-4 rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden" 
            initial={{ y: 20, opacity: 0, scale: 0.95 }} 
            animate={{ y: 0, opacity: 1, scale: 1 }} 
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Postpone Order</h2>
                  <p className="text-white/90 text-sm">
                    Set dispatch date for <span className="font-semibold">{customerName}</span>
                  </p>
                  <p className="text-white/70 text-xs mt-1">Order ID: {orderId.slice(-8)}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Quick Date Selection */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-900">
                  Select Dispatch Date
                </label>
                
                {/* Quick Options */}
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDate(tomorrow)}
                    className={`h-12 flex flex-col items-center gap-1 transition-all ${
                      selectedDate?.toDateString() === tomorrow.toDateString() 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                        : 'hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-sm font-medium">Tomorrow</span>
                    <span className="text-xs text-gray-500">{format(tomorrow, 'MMM d')}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDate(addDays(today, 3))}
                    className={`h-12 flex flex-col items-center gap-1 transition-all ${
                      selectedDate?.toDateString() === addDays(today, 3).toDateString() 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                        : 'hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-sm font-medium">In 3 Days</span>
                    <span className="text-xs text-gray-500">{format(addDays(today, 3), 'MMM d')}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDate(nextWeek)}
                    className={`h-12 flex flex-col items-center gap-1 transition-all ${
                      selectedDate?.toDateString() === nextWeek.toDateString() 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                        : 'hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-sm font-medium">Next Week</span>
                    <span className="text-xs text-gray-500">{format(nextWeek, 'MMM d')}</span>
                  </Button>
                </div>

                {/* Custom Date Picker */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Or choose a custom date</span>
                  </div>
                  
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal h-14 px-4 border-2 transition-all hover:border-blue-300 ${
                          !selectedDate ? 'text-gray-500 border-gray-300' : 'text-gray-900 border-blue-300'
                        } ${calendarOpen ? 'border-blue-500 ring-2 ring-blue-100' : ''}`}
                      >
                        <CalendarIcon className="mr-3 h-5 w-5" />
                        <div className="flex flex-col items-start">
                          <span className="text-sm">
                            {selectedDate ? format(selectedDate, 'EEEE, MMMM do, yyyy') : 'Select dispatch date'}
                          </span>
                          {selectedDate && (
                            <span className="text-xs text-gray-500">
                              {format(selectedDate, 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 shadow-2xl border-0 rounded-2xl overflow-hidden" align="start">
                      <CustomCalendar />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date Validation */}
                {selectedDate && !isDateValid && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">Please select a future date</span>
                  </div>
                )}

                {selectedDate && isDateValid && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      Dispatch scheduled for {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Customer will be notified of the new delivery schedule</li>
                      <li>• Order status will be updated to "Postponed"</li>
                      <li>• Customer can track their order status in real-time</li>
                      <li>• You can modify the dispatch date later if needed</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1 h-14 font-semibold border-2 hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePostpone}
                  disabled={!isDateValid || loading}
                  loading={loading}
                  loadingText="Postponing Order..."
                  className="flex-1 h-14 font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-white"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Postpone Order
                  </div>
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}