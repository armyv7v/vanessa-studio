#!/bin/bash
echo "Desplegando sitio estático..."
# Desplegar los archivos estáticos generados con el nombre del proyecto
npx wrangler pages deploy .vercel/output/static --project-name=vanessanails
echo "Despliegue completado."