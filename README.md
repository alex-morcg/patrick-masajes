# Patrick Masajes - Sistema de Gestión de Citas

## Configuración Inicial

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto (nombre: "patrick-masajes" o el que quieras)
3. En la configuración del proyecto, añade una aplicación web
4. Copia las credenciales de configuración

### 2. Configurar Firebase en el código

Abre `src/firebase.js` y reemplaza los valores con los de tu proyecto:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### 3. Habilitar Firestore

1. En Firebase Console, ve a "Firestore Database"
2. Crea una base de datos
3. Selecciona "Start in test mode" (para desarrollo)
4. Elige una ubicación cercana (europe-west1 para España)

### 4. Reglas de seguridad (para producción)

En Firestore > Rules, configura:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Cambiar esto para producción
    }
  }
}
```

## Desplegar en Vercel

### Opción A: Desde GitHub

1. Sube este proyecto a un repositorio de GitHub
2. Ve a [Vercel](https://vercel.com)
3. Importa el repositorio
4. Vercel detectará automáticamente que es un proyecto Vite
5. Click en "Deploy"

### Opción B: Desde CLI

```bash
npm install -g vercel
vercel login
vercel
```

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

## Estructura del Proyecto

```
patrick-masajes/
├── src/
│   ├── App.jsx        # Componente principal
│   ├── firebase.js    # Configuración de Firebase
│   ├── main.jsx       # Entry point
│   └── index.css      # Estilos Tailwind
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Funcionalidades

- ✅ Gestión de clientes
- ✅ Calendario con vistas: Lista, Día, Semana, Mes
- ✅ Citas recurrentes (semanal, quincenal, mensual)
- ✅ Etiquetas con colores personalizables
- ✅ Horario de trabajo configurable
- ✅ Festivos de Barcelona pre-cargados
- ✅ Detección de conflictos
- ✅ Estadísticas por cliente
- ✅ Diseño responsive (móvil y escritorio)
- ✅ Sincronización en tiempo real con Firebase
