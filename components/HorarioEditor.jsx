export default function HorarioEditor({ dia, rango, horarios, setHorarios }) {
    const handleChange = (index, value) => {
        const newRango = [...rango];
        newRango[index] = value;
        setHorarios({
            ...horarios,
            [dia]: newRango,
        });
    };

    const handleToggleCerrado = () => {
        if (rango.length === 0) {
            // Si está cerrado, abrir con horario por defecto
            setHorarios({
                ...horarios,
                [dia]: ['09:00', '18:00'],
            });
        } else {
            // Si está abierto, cerrar
            setHorarios({
                ...horarios,
                [dia]: [],
            });
        }
    };

    const isCerrado = rango.length === 0;

    return (
        <div className="mb-4 rounded-2xl border border-[#f3d9e4] bg-white/85 p-4 shadow-[0_10px_24px_rgba(225,27,116,0.08)] transition hover:-translate-y-[1px]">
            <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold capitalize" style={{ color: 'var(--ink-medium)' }}>{dia}</h3>
                    <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--brand-light)' }}>
                        {isCerrado ? 'Sin atención' : 'Franja activa'}
                    </p>
                </div>
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isCerrado}
                        onChange={handleToggleCerrado}
                        className="mr-2 accent-[var(--brand)]"
                    />
                    <span className="text-sm text-gray-600">Cerrado</span>
                </label>
            </div>
            {!isCerrado && (
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600 mb-1">Apertura</label>
                        <input
                            type="time"
                            value={rango[0] || '09:00'}
                            onChange={(e) => handleChange(0, e.target.value)}
                            className="rounded-xl border border-[#f2c8d4] bg-white px-3 py-2 focus:outline-none focus:ring-2"
                            style={{ color: 'var(--ink-medium)' }}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600 mb-1">Cierre</label>
                        <input
                            type="time"
                            value={rango[1] || '18:00'}
                            onChange={(e) => handleChange(1, e.target.value)}
                            className="rounded-xl border border-[#f2c8d4] bg-white px-3 py-2 focus:outline-none focus:ring-2"
                            style={{ color: 'var(--ink-medium)' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
