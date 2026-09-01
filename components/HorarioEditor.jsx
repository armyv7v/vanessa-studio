import { Clock } from 'lucide-react';

export default function HorarioEditor({ dia, rango, horarios, setHorarios }) {
  const DISPLAY_DAY_NAMES = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };
  const displayDia = DISPLAY_DAY_NAMES[dia] || dia;

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
      setHorarios({
        ...horarios,
        [dia]: ['10:00', '21:00'],
      });
    } else {
      setHorarios({
        ...horarios,
        [dia]: [],
      });
    }
  };

  const isCerrado = rango.length === 0;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-300 backdrop-blur-md ${
        isCerrado
          ? 'border-neutral-200/80 bg-neutral-50/60 opacity-70'
          : 'border-pink-200/70 bg-white/90 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="font-display text-base font-bold text-neutral-900 capitalize">
            {displayDia}
          </h4>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
              isCerrado
                ? 'bg-neutral-200 text-neutral-600'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isCerrado ? 'Cerrado' : 'Abierto / Activo'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggleCerrado}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm ${
            isCerrado
              ? 'bg-gradient-to-r from-[#E11B74] to-[#C5A059] text-white hover:opacity-90'
              : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          {isCerrado ? 'Habilitar Día' : 'Desactivar Día'}
        </button>
      </div>

      {!isCerrado && (
        <div className="mt-4 pt-3 border-t border-pink-100/70 grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1 text-[11px] font-bold text-neutral-600 uppercase mb-1">
              <Clock className="h-3 w-3 text-pink-600" />
              Apertura
            </label>
            <input
              type="time"
              value={rango[0] || '10:00'}
              onChange={(e) => handleChange(0, e.target.value)}
              className="w-full rounded-xl border border-pink-200/80 bg-white px-3 py-2 text-xs font-bold text-neutral-800 outline-none focus:border-pink-500 shadow-sm transition"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-[11px] font-bold text-neutral-600 uppercase mb-1">
              <Clock className="h-3 w-3 text-pink-600" />
              Cierre
            </label>
            <input
              type="time"
              value={rango[1] || '21:00'}
              onChange={(e) => handleChange(1, e.target.value)}
              className="w-full rounded-xl border border-pink-200/80 bg-white px-3 py-2 text-xs font-bold text-neutral-800 outline-none focus:border-pink-500 shadow-sm transition"
            />
          </div>
        </div>
      )}
    </div>
  );
}
