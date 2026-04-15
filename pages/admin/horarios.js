import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import HorarioEditor from '../../components/HorarioEditor';
import AdminShell from '../../components/AdminShell';
import { hasAdminToken } from '../../lib/adminAuth';

export default function AdminHorarios() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [horarios, setHorarios] = useState({});
    const [disabledDays, setDisabledDays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if already authenticated
    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (!hasAdminToken()) {
                    router.push('/admin/login');
                    setLoading(false);
                    return;
                }

                const res = await fetch('/api/horarios');
                if (res.ok) {
                    setIsAuthenticated(true);
                    const data = await res.json();
                    setHorarios(data.horarioAtencion || {});
                    setDisabledDays(data.disabledDays || []);
                }
            } catch (e) {
                // Not authenticated
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    const handleSave = async () => {
        try {
            const res = await fetch('/api/horarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ horarioAtencion: horarios, disabledDays }),
            });
            if (!res.ok) throw new Error('Error saving horarios');
            alert('Horarios guardados correctamente');
        } catch (e) {
            alert(e.message);
        }
    };

    if (loading) return <p className="p-6">Cargando...</p>;

    if (!isAuthenticated) {
        return null;
    }

    if (error) return <p className="p-6">Error: {error}</p>;

    const ordinalOptions = [1, 2, 3, 4, 5];

    const toggleDisabledDay = (code) => {
        setDisabledDays((prev) =>
            prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code].sort()
        );
    };

    return (
        <AdminShell
            title="Administrar horarios"
            description="Configura horarios de atención y bloquea sábados o domingos específicos del mes para controlar la disponibilidad visible en la reserva."
        >
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
                    {Object.entries(horarios).map(([dia, rango]) => (
                        <HorarioEditor
                            key={dia}
                            dia={dia}
                            rango={rango}
                            horarios={horarios}
                            setHorarios={setHorarios}
                        />
                    ))}
                </div>

                <div className="rounded-3xl border border-pink-200 bg-pink-50/60 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-pink-800 mb-2">Días deshabilitados del calendario</h2>
                    <p className="text-sm text-pink-700 mb-4">
                        Marca qué sábados o domingos del mes no deben aparecer disponibles en el flujo de reserva.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Sábados</p>
                            <div className="flex flex-wrap gap-2">
                                {ordinalOptions.map((ordinal) => {
                                    const code = `SAT${ordinal}`;
                                    const active = disabledDays.includes(code);
                                    return (
                                        <button
                                            key={code}
                                            type="button"
                                            onClick={() => toggleDisabledDay(code)}
                                            className={`px-3 py-2 rounded-full border text-sm font-medium transition ${active
                                                ? 'bg-pink-600 border-pink-600 text-white'
                                                : 'bg-white border-pink-200 text-pink-700 hover:bg-pink-100'
                                            }`}
                                        >
                                            {ordinal}° sábado
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Domingos</p>
                            <div className="flex flex-wrap gap-2">
                                {ordinalOptions.map((ordinal) => {
                                    const code = `SUN${ordinal}`;
                                    const active = disabledDays.includes(code);
                                    return (
                                        <button
                                            key={code}
                                            type="button"
                                            onClick={() => toggleDisabledDay(code)}
                                            className={`px-3 py-2 rounded-full border text-sm font-medium transition ${active
                                                ? 'bg-pink-600 border-pink-600 text-white'
                                                : 'bg-white border-pink-200 text-pink-700 hover:bg-pink-100'
                                            }`}
                                        >
                                            {ordinal}° domingo
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="rounded-2xl bg-gradient-to-r from-pink-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(219,39,119,0.24)] transition hover:translate-y-[-1px]"
                >
                    Guardar Cambios
                </button>
            </div>
        </AdminShell>
    );
}
