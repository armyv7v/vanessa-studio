import React, { useState } from 'react';

export default function BloqueosCalendar({ disabledDays, setDisabledDays }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modoBloqueo, setModoBloqueo] = useState('dia'); // 'dia', 'semana', 'mes'

  // Helper functions for dates
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => {
    let day = new Date(y, m, 1).getDay();
    // Ajustar para que Lunes sea 0 y Domingo 6
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Helper to format date as YYYY-MM-DD
  const formatDate = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const isBlocked = (dateStr) => disabledDays.includes(dateStr);

  const toggleDay = (dateStr) => {
    setDisabledDays((prev) => 
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const toggleWeek = (day) => {
    const clickedDate = new Date(year, month, day);
    // Find monday of this week
    const currentDay = clickedDate.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(clickedDate);
    monday.setDate(clickedDate.getDate() - diffToMonday);

    let weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(formatDate(d.getFullYear(), d.getMonth(), d.getDate()));
    }

    const allBlocked = weekDates.every(d => isBlocked(d));
    
    if (allBlocked) {
      setDisabledDays(prev => prev.filter(d => !weekDates.includes(d)));
    } else {
      setDisabledDays(prev => {
        const unique = new Set([...prev, ...weekDates]);
        return Array.from(unique);
      });
    }
  };

  const toggleMonth = () => {
    let monthDates = [];
    for (let i = 1; i <= daysInMonth; i++) {
        monthDates.push(formatDate(year, month, i));
    }
    
    const allBlocked = monthDates.every(d => isBlocked(d));

    if (allBlocked) {
        setDisabledDays(prev => prev.filter(d => !monthDates.includes(d)));
    } else {
        setDisabledDays(prev => {
            const unique = new Set([...prev, ...monthDates]);
            return Array.from(unique);
        });
    }
  };

  const handleCellClick = (day) => {
    const dateStr = formatDate(year, month, day);
    if (modoBloqueo === 'dia') toggleDay(dateStr);
    if (modoBloqueo === 'semana') toggleWeek(day);
    if (modoBloqueo === 'mes') toggleMonth();
  };

  return (
    <div className="premium-panel grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-8">
      {/* Columna Izquierda: Calendario */}
      <div className="w-full lg:col-span-7">
        <h2 className="text-lg font-bold text-[var(--ink-medium)] mb-1">Calendario visual de bloqueos</h2>
        <p className="text-sm text-[var(--ink-muted)] mb-6">
          Haz clic sobre un día para bloquear la cita rápidamente.
        </p>

        {/* Header Calendario */}
        <div className="flex items-center justify-between mb-4 px-2">
            <button type="button" onClick={prevMonth} className="p-2 hover:bg-[#FDE8F2] rounded-full text-[var(--brand)] transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <span className="font-bold text-[var(--ink-medium)]">{monthNames[month]} {year}</span>
            <button type="button" onClick={nextMonth} className="p-2 hover:bg-[#FDE8F2] rounded-full text-[var(--brand)] transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
            {weekDays.map(d => (
                <div key={d} className="text-center text-xs font-bold text-[var(--ink-muted)] py-1">{d}</div>
            ))}
            
            {/* Espacios vacíos */}
            {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10"></div>
            ))}
            
            {/* Días del mes */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dStr = formatDate(year, month, day);
                const blocked = isBlocked(dStr);
                
                return (
                    <button
                        key={day}
                        type="button"
                        onClick={() => handleCellClick(day)}
                        className={`aspect-square w-full rounded-xl text-sm font-medium flex items-center justify-center transition-all ${
                            blocked 
                                ? 'bg-[var(--brand)] text-white shadow-md' 
                                : 'bg-white border border-[#F2C8D4] text-[var(--ink-medium)] hover:border-[var(--brand)] hover:text-[var(--brand)]'
                        }`}
                    >
                        {day}
                    </button>
                )
            })}
        </div>

        {/* Leyenda */}
        <div className="flex gap-4 items-center text-xs text-[var(--ink-muted)]">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[var(--brand)]"></span> Día bloqueado</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-white border border-[#F2C8D4]"></span> Día disponible</div>
        </div>
      </div>

      {/* Columna Derecha: Controles y Resumen */}
      <div className="w-full lg:col-span-5 flex flex-col gap-6">
        {/* Segmented Control de Modos */}
        <div className="bg-[#FBF4FB] border border-[#F2C8D4] p-1.5 rounded-2xl flex flex-wrap gap-1">
            <button 
                type="button"
                onClick={() => setModoBloqueo('dia')}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${modoBloqueo === 'dia' ? 'bg-white text-[var(--brand)] shadow-sm' : 'text-[var(--ink-muted)] hover:text-[var(--ink-medium)]'}`}
            >Por día</button>
            <button 
                type="button"
                onClick={() => setModoBloqueo('semana')}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${modoBloqueo === 'semana' ? 'bg-white text-[var(--brand)] shadow-sm' : 'text-[var(--ink-muted)] hover:text-[var(--ink-medium)]'}`}
            >Por semana</button>
            <button 
                type="button"
                onClick={() => setModoBloqueo('mes')}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${modoBloqueo === 'mes' ? 'bg-white text-[var(--brand)] shadow-sm' : 'text-[var(--ink-muted)] hover:text-[var(--ink-medium)]'}`}
            >Por mes</button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#F2C8D4]">
            <h3 className="text-sm font-bold text-[var(--ink-medium)] mb-2">Resumen rápido</h3>
            <p className="text-xs text-[var(--ink-muted)] mb-4 leading-relaxed">
                El modo activo actual te permite seleccionar o deseleccionar en bloque. 
                Los sábados y domingos genéricos también pueden desactivarse de manera masiva utilizando los controles inferiores.
            </p>
            <button type="button" onClick={() => setDisabledDays([])} className="text-sm text-[var(--brand)] font-semibold hover:underline">
                Limpiar todas las fechas seleccionadas
            </button>
        </div>
      </div>
    </div>
  );
}
