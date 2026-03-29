# Migración a Firebase Cloud Firestore (Trip Planner)

Esta guía explica **lo que debes configurar manualmente** para que la app use Firestore en lugar de `localStorage`.

## 1) Crear proyecto Firebase

1. Ve a https://console.firebase.google.com/
2. Crea un proyecto nuevo (o usa uno existente).
3. Dentro del proyecto, entra a **Project settings** (icono de engranaje).
4. En la sección **Your apps**, crea una app **Web** (icono `</>`).
5. Copia el bloque de configuración de Firebase (apiKey, authDomain, etc.).

## 2) Activar Firestore

1. En el menú izquierdo, entra a **Firestore Database**.
2. Pulsa **Create database**.
3. Selecciona modo de inicio (para desarrollo puedes usar modo de prueba temporalmente).
4. Selecciona la región de Firestore.
5. Confirma creación.

## 3) Configurar variables de entorno en este proyecto

Crea un archivo `.env.local` en la raíz del proyecto con este formato:

```bash
VITE_FIREBASE_API_KEY="tu_api_key"
VITE_FIREBASE_AUTH_DOMAIN="tu_proyecto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="tu_project_id"
VITE_FIREBASE_STORAGE_BUCKET="tu_proyecto.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="tu_messaging_sender_id"
VITE_FIREBASE_APP_ID="tu_app_id"
```

> Archivo donde se usa: `src/utils/firebase.js`.

## 4) Persistencia offline (Firestore Web)

La app ya la activa en código con caché persistente multi‑tab (`persistentLocalCache` + `persistentMultipleTabManager`) y fallback a memoria si no se puede activar en ese navegador.

No necesitas un paso manual extra en consola para esto.

## 5) Reglas mínimas recomendadas para desarrollo

Para desarrollo local (solo temporal), puedes usar reglas permisivas y luego endurecerlas:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **No uses estas reglas en producción**.

## 6) Recomendación mínima para producción

- Obliga autenticación (Firebase Auth).
- Limita lectura/escritura por usuario o por documento.
- Valida campos permitidos (`id`, `createdAt`, `updatedAt`, `deleted`, etc.).

## 7) Colecciones usadas por la app

- `plannerDays`
- `plannerEvents`

Cada documento guarda metadatos de sincronización:

- `id`
- `createdAt`
- `updatedAt`
- `deleted`

La app usa borrado lógico (`deleted: true`).

## 8) Migración de datos inicial

- Si Firestore está vacío, la app intenta sembrar datos con lo que tenga en `localStorage` (o datos por defecto).
- A partir de ese momento, el flujo principal queda en Firestore.

## 9) Ejecutar en local

```bash
npm install
npm run dev
```

## 10) Build / despliegue

```bash
npm run build
npm run preview
```

Asegúrate de que las variables `VITE_FIREBASE_*` estén definidas en el entorno de build/deploy (Vercel, Netlify, CI, etc.).
