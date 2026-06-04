# Directrices de Desarrollo para Agentes: Antigravity & OpenCode

Este archivo define las reglas de comportamiento estrictas para asistentes y agentes de IA (incluyendo Google Antigravity, OpenCode y gentle-ai) al operar en el código de este proyecto. Se basa en los principios de "Andrej Karpathy Skills" para evitar los errores más comunes de los LLM durante la programación.

## 1. Piensa Antes de Programar (Think Before Coding)
Los modelos de IA tienden a asumir cosas en silencio y avanzar con una interpretación incorrecta. 
* **No asumas, hazlo explícito:** Si existe incertidumbre en un requerimiento (por ejemplo, cómo estructurar los datos para la aplicación, o detalles de una integración de pagos o seguridad en Chile), detente y pregunta.
* **Presenta alternativas y trade-offs:** Si hay múltiples formas de abordar un problema de despliegue (ej. diferencias entre configuraciones para Firebase Hosting vs. Vercel), presenta las opciones antes de elegir silenciosamente.
* **Cuestiona las malas ideas:** Si existe una manera más simple de resolver el problema, comunícalo y sugiere la alternativa.
* **Maneja tu confusión:** Identifica exactamente qué parte del código o de la arquitectura no entiendes y solicita aclaraciones.

## 2. Simplicidad Primero (Simplicity First)
El objetivo es el código mínimo necesario que resuelva el problema actual. Nada de código especulativo.
* **Cero abstracciones innecesarias:** No construyas sistemas complejos de múltiples capas cuando un bloque más directo cumple perfectamente la función.
* **Evita la sobre-ingeniería:** No agregues "flexibilidad" ni "configurabilidad" que no haya sido solicitada explícitamente en el prompt actual.
* **No manejes escenarios imposibles:** Limítate al alcance del problema real. Si algo que tomaría 200 líneas se puede hacer en 50 claras, simplifícalo.

## 3. Cambios Quirúrgicos (Surgical Changes)
Modifica únicamente lo estrictamente necesario para cumplir el objetivo.
* **No refactorices código adyacente:** Incluso si crees que el código aledaño se puede "mejorar" o si el estilo no es el que elegirías. Mantén la consistencia con el estilo existente.
* **No alteres comentarios no relacionados:** Modificar código o comentarios que no entiendes completamente como "efecto secundario" está prohibido.
* **Limpia solo tu propio desastre:** Si tus cambios dejan importaciones, variables o funciones huérfanas, elimínalas. Sin embargo, no elimines código muerto *preexistente* a menos que se te indique específicamente.
* **Trazabilidad:** Cada línea que cambies o generes en OpenCode debe tener un propósito claro que se rastree directamente a la solicitud en curso.

## 4. Ejecución Orientada a Objetivos (Goal-Driven Execution)
Transforma las tareas imperativas en objetivos verificables para aprovechar la capacidad de iteración de los agentes.
* **Define criterios de éxito:** En lugar de "arregla el error", tu enfoque debe ser "escribe una prueba (o script de verificación) que reproduzca el error, y luego haz que pase".
* **Planificación por pasos (Looping):** Para tareas complejas en Antigravity o agentes iterativos, declara un plan breve antes de ejecutar comandos:
  1. [Paso a ejecutar] -> verificar: [Criterio exacto de éxito]
  2. [Paso a ejecutar] -> verificar: [Criterio exacto de éxito]
* **Verificación autónoma:** Los agentes operan mejor cuando verifican su éxito en cada ciclo antes de avanzar. Utiliza logs o tests para comprobar la validez de los pasos.

## Notas Adicionales del Entorno y Ejecución
* **Compatibilidad de Entorno:** Asegúrate de que todos los scripts, rutas de archivos y comandos de terminal generados sean nativamente compatibles con entornos de desarrollo en Windows 10 (ej. usar sintaxis de PowerShell y evitar rutas exclusivas de Unix a menos que se corra en WSL o contenedores específicos).
* **Validación de Pasos:** Siempre evalúa las salidas de consola de herramientas como `gentle-ai` o `opencode` en cada paso para asegurar que no se hayan introducido fallos silenciosos.
