import { DateTime } from 'luxon';

export const runtime = 'edge';

const BACKEND_URL = 'https://vanessastudioback.netlify.app/.netlify/functions/api';
const TIMEZONE = process.env.NEXT_PUBLIC_TZ || 'America/Santiago';

// Config de horarios inlineada (no puede ser import JSON en Cloudflare edge)
const horariosConfig = {
    horarioAtencion: {
        lunes:      ['09:00', '22:00'],
        martes:     ['09:00', '22:00'],
        miércoles:  ['09:00', '22:00'],
        jueves:     ['09:00', '22:00'],
        viernes:    ['09:00', '22:00'],
        sábado:     ['09:00', '22:00'],
        domingo:    ['09:00', '22:00'],
    },
};

// Mapeo de días de la semana (0=domingo, 1=lunes, etc.)
const DAY_NAMES = {
    0: 'domingo',
    1: 'lunes',
    2: 'martes',
    3: 'miércoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sábado'
};

// Convertir el formato del JSON a nuestro formato
function getHorarioAtencion() {
    const horarios = {};
    for (let dayNum = 0; dayNum <= 6; dayNum++) {
        const dayName = DAY_NAMES[dayNum];
        const horario = horariosConfig.horarioAtencion[dayName];

        if (horario && horario.length === 2) {
            horarios[dayNum] = {
                inicio: horario[0],
                fin: horario[1]
            };
        } else {
            horarios[dayNum] = null; // Día cerrado
        }
    }
    return horarios;
}

const HORARIO_ATENCION = getHorarioAtencion();

const DURACION_TURNO = 30; // minutos

function generateTimeSlots(startTime, endTime, duration) {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + duration <= endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const mins = currentMinutes % 60;
        const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        slots.push(timeStr);
        currentMinutes += duration;
    }

    return slots;
}

function isSlotBusy(dateStr, timeStr, busySlots) {
    if (!busySlots || busySlots.length === 0) return false;

    // Construir el intervalo del slot en la zona horaria correcta
    // dateStr es YYYY-MM-DD, timeStr es HH:MM
    const slotStart = DateTime.fromISO(`${dateStr}T${timeStr}:00`, { zone: TIMEZONE });
    const slotEnd = slotStart.plus({ minutes: DURACION_TURNO });

    return busySlots.some(busy => {
        if (!busy || !busy.start || !busy.end) return false;

        try {
            // Parsear las fechas del busy slot (vienen del backend, probablemente ISO con offset o UTC)
            const busyStart = DateTime.fromISO(busy.start).setZone(TIMEZONE);
            const busyEnd = DateTime.fromISO(busy.end).setZone(TIMEZONE);

            // Verificar si hay overlap
            // Hay overlap si: slotStart < busyEnd && slotEnd > busyStart
            const hasOverlap = slotStart < busyEnd && slotEnd > busyStart;

            if (hasOverlap) {
                console.log('Slot ocupado encontrado:', {
                    slot: slotStart.toISO(),
                    busyPeriod: `${busyStart.toISO()} - ${busyEnd.toISO()}`
                });
            }

            return hasOverlap;
        } catch (error) {
            console.error('Error parsing busy slot:', error, busy);
            return false;
        }
    });
}

export default async function handler(req) {
    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // En Edge Runtime, usar nextUrl si está disponible
        const url = req.nextUrl || new URL(req.url, `http://${req.headers.get('host') || 'localhost'}`);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');

        console.log('Available slots request:', { startDate, endDate, timezone: TIMEZONE });

        if (!startDate || !endDate) {
            return new Response(JSON.stringify({
                error: 'Missing required parameters: startDate and endDate',
                received: { startDate, endDate }
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Obtener turnos ocupados del backend
        const backendUrl = `${BACKEND_URL}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

        console.log('Fetching busy slots from backend:', backendUrl);

        let busySlots = [];
        try {
            const response = await fetch(backendUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    busySlots = data.busy || [];
                    console.log('Busy slots received:', busySlots.length);
                } catch (parseError) {
                    console.error('Failed to parse backend response:', parseError);
                }
            } else {
                console.warn('Backend returned non-OK status:', response.status);
            }
        } catch (fetchError) {
            console.error('Failed to fetch from backend:', fetchError);
        }

        // Generar todos los turnos disponibles para el rango de fechas
        const availableSlots = [];
        // Usar Luxon para iterar días en la zona horaria correcta
        const start = DateTime.fromISO(startDate, { zone: TIMEZONE }).startOf('day');
        const end = DateTime.fromISO(endDate, { zone: TIMEZONE }).endOf('day');
        const now = DateTime.now().setZone(TIMEZONE);

        console.log('Generating slots for date range:', {
            start: start.toISO(),
            end: end.toISO(),
            now: now.toISO()
        });

        let currentDate = start;
        const maxIterations = 100;
        let iterationCount = 0;

        while (currentDate <= end && iterationCount < maxIterations) {
            // Luxon weekday: 1=Monday, ..., 7=Sunday. 
            // Our config uses 0=Sunday, 1=Monday.
            // Convert Luxon weekday to our format:
            const luxonWeekday = currentDate.weekday; // 1-7
            const dayOfWeek = luxonWeekday === 7 ? 0 : luxonWeekday;

            const horario = HORARIO_ATENCION[dayOfWeek];

            if (horario) {
                const dateStr = currentDate.toISODate(); // YYYY-MM-DD
                const timeSlots = generateTimeSlots(horario.inicio, horario.fin, DURACION_TURNO);

                for (const time of timeSlots) {
                    // Verificar si el slot ya pasó
                    const slotDateTime = DateTime.fromISO(`${dateStr}T${time}:00`, { zone: TIMEZONE });

                    if (slotDateTime <= now) {
                        continue; // Saltar turnos pasados
                    }

                    const isBusy = isSlotBusy(dateStr, time, busySlots);
                    if (!isBusy) {
                        // Calcular hora de fin
                        const slotEnd = slotDateTime.plus({ minutes: DURACION_TURNO });
                        const endTimeStr = slotEnd.toFormat('HH:mm');

                        availableSlots.push({
                            start: slotDateTime.toISO(), // ISO completo con offset
                            end: endTimeStr,
                            available: true
                        });
                    }
                }
            }

            currentDate = currentDate.plus({ days: 1 });
            iterationCount++;
        }

        console.log('Generated available slots:', availableSlots.length);

        return new Response(JSON.stringify({ available: availableSlots }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Available slots error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch available slots',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
