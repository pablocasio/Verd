# Verdulista Pro - React + Vite

App moderna para crear listas de verduras con emojis, precios, historial por fecha, reporte visual, descarga en PDF/imagen y compartir por WhatsApp.

## Instalar

```bash
npm install
npm run dev
```

Abre la URL que te da Vite, normalmente:

```bash
http://localhost:5173
```

## Funciones

- Agregar verduras con precio y cantidad.
- Emoji automático por verdura.
- Recomendaciones dinámicas: si agregas una verdura nueva, queda guardada.
- Historial de listas por fecha usando `localStorage`.
- Reporte visual colorido.
- Descargar PDF.
- Descargar imagen PNG.
- Compartir por WhatsApp.

## Importante sobre WhatsApp

Desde navegador no siempre se puede adjuntar un PDF automáticamente a WhatsApp Web.
En celulares compatibles, la app usa `navigator.share()` y puede compartir el PDF como archivo.
En PC, abre WhatsApp Web con el texto de la lista y puedes adjuntar el PDF descargado.
