// lib/businessInfo.js — Fuente única de verdad de los datos públicos del negocio.
export const BUSINESS = {
  name: 'Vanessa Nails Studio',
  address: 'Pasaje Ricardo Videla 691, Coquimbo, Chile',
  addressShort: 'Coquimbo, Chile',
  phone: '+56 9 9174 4464',
  phoneFull: '56991744464',
  instagram: '@nailsvanessa.cl',
  instagramUrl: 'https://www.instagram.com/nailsvanessa.cl/',
  hours: 'Lunes a Domingo',
  hoursTime: '10:00 a 21:00',
  priceRange: 'CLP 10.000 – CLP 45.000',
};

/** Enlace de WhatsApp con mensaje precargado. */
export function whatsappLink(message) {
  const text = encodeURIComponent(
    message || 'Hola Vanessa 👋 Quiero reservar una cita en Vanessa Nails Studio.'
  );
  return `https://wa.me/${BUSINESS.phoneFull}?text=${text}`;
}

export const WHATSAPP_DEFAULT = whatsappLink();
export const WHATSAPP_BOOKING = whatsappLink(
  'Hola Vanessa 👋 Quiero reservar una cita. ¿Me ayudas con la disponibilidad?'
);
export const WHATSAPP_SERVICES = whatsappLink(
  'Hola Vanessa 👋 Me interesa un servicio de uñas, ¿me cuentas precios y disponibilidad?'
);
