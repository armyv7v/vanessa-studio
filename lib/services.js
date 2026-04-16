/**
 * Lista completa de los servicios que ofrece Vanessa Nails Studio.
 * Cada objeto contiene:
 *  - id   : entero único (para usar en la UI y en la BD)
 *  - name : nombre visible
 *  - duration : duración del servicio en minutos
 */           
export const services = [
  {
    id: 1,
    name: "Retoque (Mantenimiento)",
    duration: 120,
    summary: "Renueva crecimiento, estructura y acabado para mantener el set prolijo por más tiempo.",
    highlights: ["Mantenimiento", "Corrección de crecimiento"],
  },
  {
    id: 2,
    name: "Reconstrucción Uñas Mordidas (Onicofagía)",
    duration: 180,
    summary: "Diseñado para reconstruir visualmente la uña, estilizar manos y recuperar una base armónica.",
    highlights: ["Reconstrucción", "Estructura completa"],
  },
  {
    id: 3,
    name: "Uñas Acrílicas",
    duration: 180,
    summary: "Set completo de alta duración ideal para longitud, estructura firme y diseño con más presencia.",
    highlights: ["Larga duración", "Mayor estructura"],
  },
  {
    id: 4,
    name: "Uñas Polygel",
    duration: 180,
    summary: "Equilibrio entre resistencia y ligereza para un acabado elegante, cómodo y durable.",
    highlights: ["Ligero", "Resistente"],
  },
  {
    id: 5,
    name: "Uñas Softgel",
    duration: 180,
    summary: "Extensión uniforme y sofisticada para lograr manos pulidas con acabado limpio y moderno.",
    highlights: ["Acabado limpio", "Extensión rápida"],
  },
  {
    id: 6,
    name: "Kapping o Baño Polygel o Acrílico sobre uña natural",
    duration: 150,
    summary: "Refuerza la uña natural sin extensión, mejorando resistencia, forma y apariencia general.",
    highlights: ["Refuerzo natural", "Sin extensión"],
  },
  {
    id: 7,
    name: "Reforzamiento Nivelación Rubber",
    duration: 150,
    summary: "Nivela superficie, corrige irregularidades y deja una base más firme para un look impecable.",
    highlights: ["Nivelación", "Base uniforme"],
  },
  {
    id: 8,
    name: "Esmaltado Permanente",
    duration: 90,
    summary: "Servicio ágil para brillo duradero, color impecable y manos prolijas en menos tiempo.",
    highlights: ["Brillo duradero", "Servicio express"],
  },
];
