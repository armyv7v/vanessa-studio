import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import AdminShell from '../../components/AdminShell';
import { hasAdminToken } from '../../lib/adminAuth';

export default function ValidarCitas() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('today');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (!hasAdminToken()) {
            router.push('/admin/login');
        } else {
            setIsAuthenticated(true);
            setLoading(false);
        }
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <AdminShell
            title="Validar citas"
            description="Panel de validación manual de asistencia. Hoy sigue siendo un respaldo para casos donde el QR no esté disponible."
        >
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap gap-3 mb-6">
                        <button
                            onClick={() => setFilter('today')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${filter === 'today'
                                ? 'bg-pink-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => setFilter('week')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${filter === 'week'
                                ? 'bg-pink-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Esta semana
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${filter === 'all'
                                ? 'bg-pink-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todas
                        </button>
                    </div>

                    <div className="rounded-2xl border-2 border-yellow-300 bg-yellow-50 p-6 text-center">
                        <p className="text-yellow-800 font-semibold mb-2">Función en desarrollo</p>
                        <p className="text-yellow-700 text-sm mb-4">
                            Este panel todavía no lista citas manualmente. El método recomendado sigue siendo la validación con QR.
                        </p>
                        <p className="text-gray-600 text-sm">
                            Próximo paso sugerido: traer citas por rango y habilitar validación manual desde este dashboard.
                        </p>
                    </div>
                </div>

                <div className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Instrucciones</h2>
                    <div className="space-y-3 text-gray-700">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">📱</span>
                            <div>
                                <p className="font-semibold">Validación con QR (Recomendado)</p>
                                <p className="text-sm text-gray-600">
                                    Escanea el código QR que la clienta trae en su email de confirmación.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">✍️</span>
                            <div>
                                <p className="font-semibold">Validación manual (backup)</p>
                                <p className="text-sm text-gray-600">
                                    Este panel será el respaldo cuando el QR no funcione o la clienta no lo tenga.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">💅</span>
                            <div>
                                <p className="font-semibold">Sellos automáticos</p>
                                <p className="text-sm text-gray-600">
                                    La validación correcta debe seguir sumando automáticamente el sello a la fidelidad.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
