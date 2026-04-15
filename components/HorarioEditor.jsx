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
        <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold capitalize">{dia}</h3>
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isCerrado}
                        onChange={handleToggleCerrado}
                        className="mr-2"
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
                            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-600 mb-1">Cierre</label>
                        <input
                            type="time"
                            value={rango[1] || '18:00'}
                            onChange={(e) => handleChange(1, e.target.value)}
                            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
