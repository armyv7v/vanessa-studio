import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    eachDayOfInterval, addDays, addMonths, subMonths, addWeeks, subWeeks,
    isSameMonth, isSameDay, parseISO, getDay, startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { getAvailableSlotsRange } from '../../lib/api';
import AdminShell from '../../components/AdminShell';
import { hasAdminToken } from '../../lib/adminAuth';

export default function AdminTurnos() {
    const router = useRouter();
    // --- Auth State ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- Calendar State ---
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedDayEvents, setSelectedDayEvents] = useState(null);

    // --- Auth Logic ---
    useEffect(() => {
        const checkAuth = () => {
            if (!hasAdminToken()) {
                router.push('/admin/login');
                setLoading(false);
                return;
            }
            setIsAuthenticated(hasAdminToken());
            setLoading(false);
        };
        checkAuth();
    }, [router]);

    // --- Calendar Data Fetching ---
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchSlots = async () => {
            setLoadingSlots(true);
            try {
                let start, end;
                if (viewMode === 'month') {
                    start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
                    end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
                } else {
                    start = startOfWeek(currentDate, { weekStartsOn: 1 });
                    end = endOfWeek(currentDate, { weekStartsOn: 1 });
                }

                const slots = await getAvailableSlotsRange(start, end);
                setAvailableSlots(slots);
            } catch (error) {
                console.error('Error fetching slots:', error);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [isAuthenticated, currentDate, viewMode]);

    // --- Helpers ---
    const nextPeriod = () => {
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
        else setCurrentDate(addWeeks(currentDate, 1));
    };

    const prevPeriod = () => {
        if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
        else setCurrentDate(subWeeks(currentDate, 1));
    };

    const getEventsForDay = (day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return availableSlots.filter(slot => {
            const slotStart = parseISO(slot.start);
            return format(slotStart, 'yyyy-MM-dd') === dayStr;
        }).sort((a, b) => new Date(a.start) - new Date(b.start));
    };

    // Calcular disponibilidad y color para mapa de calor
    const getAvailabilityColor = (day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayOfWeek = day.getDay();

        // Calcular total de slots posibles para el día (09:00-22:00 = 13 horas = 26 slots de 30 min)
        const totalPossibleSlots = 26;

        // Contar slots disponibles para este día
        const availableCount = availableSlots.filter(slot => {
            const slotStart = parseISO(slot.start);
            return format(slotStart, 'yyyy-MM-dd') === dayStr;
        }).length;

        // Calcular porcentaje de disponibilidad
        const availabilityPercent = (availableCount / totalPossibleSlots) * 100;

        // Determinar color según disponibilidad
        if (availabilityPercent > 75) return 'bg-green-100 border-green-300';
        if (availabilityPercent > 50) return 'bg-yellow-100 border-yellow-300';
        if (availabilityPercent > 25) return 'bg-orange-100 border-orange-300';
        return 'bg-red-100 border-red-300';
    };

    // --- Render ---
    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div></div>;

    if (!isAuthenticated) {
        return null;
    }

    const days = viewMode === 'month'
        ? eachDayOfInterval({
            start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
            end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
        })
        : eachDayOfInterval({
            start: startOfWeek(currentDate, { weekStartsOn: 1 }),
            end: endOfWeek(currentDate, { weekStartsOn: 1 })
        });

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <AdminShell
            title="Calendario de turnos"
            description="Visualiza disponibilidad por semana o mes, detecta demanda y revisa rápidamente qué días tienen más o menos espacios libres."
        >
            <Head>
                <title>Admin Turnos | Vanessa Studio</title>
            </Head>

            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">📅 Calendario de Turnos</h1>

                    <div className="flex items-center bg-white rounded-lg shadow p-1">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'month' ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Mes
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'week' ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Semana
                        </button>
                    </div>
                </div>

                {/* Leyenda de disponibilidad */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Disponibilidad:</h3>
                    <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-100 border border-green-300 rounded"></div>
                            <span>Alta (&gt;75%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-yellow-100 border border-yellow-300 rounded"></div>
                            <span>Media (50-75%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-orange-100 border border-orange-300 rounded"></div>
                            <span>Baja (25-50%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-red-100 border border-red-300 rounded"></div>
                            <span>Muy baja (&lt;25%)</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Header Calendario */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                        <button onClick={prevPeriod} className="p-2 hover:bg-gray-200 rounded-full transition">
                            ←
                        </button>
                        <h2 className="text-xl font-semibold text-gray-800 capitalize">
                            {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Semana del' d 'de' MMMM", { locale: es })}
                        </h2>
                        <button onClick={nextPeriod} className="p-2 hover:bg-gray-200 rounded-full transition">
                            →
                        </button>
                    </div>

                    {/* Grid Header (Días semana) */}
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                        {weekDays.map(day => (
                            <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Grid Días */}
                    <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'auto-rows-fr' : 'h-[600px]'}`}>
                        {days.map((day, idx) => {
                            const isToday = isSameDay(day, new Date());
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const dayEvents = getEventsForDay(day);
                            const availabilityColor = getAvailabilityColor(day);

                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => setSelectedDayEvents({ date: day, events: dayEvents })}
                                    className={`
                                        min-h-[100px] border-b border-r p-2 transition hover:opacity-80 cursor-pointer relative
                                        ${!isCurrentMonth && viewMode === 'month' ? 'bg-gray-50 text-gray-400 opacity-50' : availabilityColor}
                                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`
                                            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                            ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}
                                        `}>
                                            {format(day, 'd')}
                                        </span>
                                        {dayEvents.length > 0 && (
                                            <span className="text-xs font-bold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
                                                {dayEvents.length}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-2 space-y-1">
                                        {dayEvents.slice(0, 3).map((event, i) => (
                                            <div key={i} className="text-xs truncate bg-green-100 text-green-700 rounded px-1 py-0.5 border-l-2 border-green-500">
                                                {format(parseISO(event.start), 'HH:mm')} - Libre
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-xs text-gray-400 pl-1">
                                                + {dayEvents.length - 3} más
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Modal Detalle Día */}
            {selectedDayEvents && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDayEvents(null)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-pink-600 p-4 flex justify-between items-center text-white">
                            <h3 className="text-lg font-bold">
                                {format(selectedDayEvents.date, "EEEE d 'de' MMMM", { locale: es })}
                            </h3>
                            <button onClick={() => setSelectedDayEvents(null)} className="text-white hover:bg-pink-700 rounded-full p-1">
                                ✕
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {selectedDayEvents.events.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No hay turnos disponibles para este día.</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedDayEvents.events.map((event, i) => (
                                        <div key={i} className="flex items-center p-3 bg-green-50 rounded-lg border border-green-100">
                                            <div className="bg-green-100 text-green-700 font-bold rounded px-2 py-1 text-sm mr-3">
                                                {format(parseISO(event.start), 'HH:mm')}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">Turno Disponible</p>
                                                <p className="text-xs text-gray-500">
                                                    {format(parseISO(event.start), 'HH:mm')} - {event.end}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50 p-4 text-right">
                            <button
                                onClick={() => setSelectedDayEvents(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
