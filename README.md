## 🔗 Integración del Frontend (React) con el Flujo de Autenticación

La aplicación frontend construida con React se comunica con la API de autenticación mediante llamadas HTTP, utilizando cookies para el manejo de sesión. A continuación, se detalla cómo se implementa este flujo en el frontend.

### 📌 Componentes Clave

* **`AuthProvider`**: Contexto global que gestiona el estado de autenticación del usuario.
* **`useAuth`**: Hook personalizado para acceder fácilmente al contexto de autenticación.
* **`LoginPage`**: Página que inicia el flujo de autenticación con Google.
* **`Dashboard`**: Página protegida que muestra la información del usuario autenticado.

### 🚀 Flujo de Autenticación desde el Frontend

1. **Redirección al Login de Google**

   * Cuando el usuario pulsa "Iniciar sesión con Google", se redirige a `/api/v1/auth/google`, el cual inicia el flujo de OAuth.

   ```tsx
   const login = () => {
     window.location.href = `${API_BASE_URL}/auth/google`;
   };
   ```

2. **Callback y Establecimiento de Cookies**

   * Tras completar el login en Google, el backend maneja el callback (`/api/v1/auth/google/callback`), genera un JWT, y lo guarda en cookies **httpOnly**.
   * El frontend no necesita leer el token directamente, ya que se envía automáticamente con `credentials: "include"` en las peticiones.

3. **Verificación del Estado de Sesión**

   * Al iniciar la app o refrescar la página, el `AuthProvider` ejecuta `checkAuth()` haciendo una solicitud a `/api/v1/auth/test`. Si la cookie de sesión es válida, se obtiene el payload del usuario.

   ```tsx
   const response = await fetch(`${API_BASE_URL}/auth/test`, {
     method: "GET",
     credentials: "include", // envía cookies al backend
   });
   ```

4. **Cierre de Sesión**

   * Al hacer clic en "Cerrar sesión", el frontend realiza un `POST` a `/api/v1/auth/logout`, lo cual elimina las cookies de sesión y redirige o recarga el estado.

   ```tsx
   const response = await fetch(`${API_BASE_URL}/auth/logout`, {
     method: "POST",
     credentials: "include",
   });
   ```

### ✅ Estado de Autenticación

El `AuthProvider` mantiene tres estados principales:

* `user`: Información del usuario autenticado.
* `isAuthenticated`: Booleano que indica si la sesión está activa.
* `isLoading`: Estado de carga mientras se valida la sesión.

Esto permite renderizar condicionalmente el login o el dashboard:

```tsx
return isAuthenticated ? <Dashboard /> : <LoginPage />;
```

### 🔒 Seguridad

* Las cookies de sesión se configuran como **httpOnly**, evitando que el frontend acceda directamente a los tokens.
* Todas las solicitudes que requieren sesión activa incluyen `credentials: "include"` para enviar las cookies de sesión.
* El backend valida cada token y asegura que el usuario tenga permisos antes de acceder a recursos protegidos.

---

## 🧪 Endpoints Usados por el Frontend

| Método | Endpoint              | Descripción                           |
| ------ | --------------------- | ------------------------------------- |
| `GET`  | `/api/v1/auth/google` | Redirige a Google para iniciar sesión |
| `GET`  | `/api/v1/auth/test`   | Verifica si la sesión está activa     |
| `POST` | `/api/v1/auth/logout` | Cierra sesión y elimina cookies       |

---

## 🛠️ Requisitos de Configuración

Asegúrate de que:

* El frontend está corriendo en un origen permitido por CORS.
* El backend permite solicitudes `cross-origin` con `credentials: true`.
* Las cookies se configuran con `SameSite=None` y `Secure` si usas HTTPS (recomendado en producción).

---

## 📁 Estructura Sugerida del Frontend

```
src/
├── components/
│   └── LoginPage.tsx
│   └── Dashboard.tsx
├── context/
│   └── AuthContext.tsx
├── App.tsx
└── index.tsx
```

---

Con esta integración, el frontend puede autenticarse con Google de manera segura y mantener una sesión persistente usando cookies, sin necesidad de almacenar manualmente los tokens en `localStorage` o `sessionStorage`.

---

Perfecto. Aquí tienes una sección adicional que puedes agregar a tu `README.md` para documentar **cómo configurar la autenticación para producción**, incluyendo despliegues en **Vercel**, **Netlify** u otras plataformas similares.

---

## 🚀 Despliegue en Producción

Para que el flujo de autenticación con Google OAuth funcione correctamente en producción (por ejemplo en **Vercel**, **Netlify**, **Render**, etc.), es importante tener en cuenta varios puntos relacionados con **CORS**, **cookies**, **dominios permitidos** y **variables de entorno**.

---

### ✅ Requisitos Generales

1. **Dominio HTTPS**

   * Google OAuth **requiere HTTPS** para redirecciones OAuth en producción.
   * Plataformas como Vercel y Netlify ya te ofrecen HTTPS automáticamente.

2. **Redirecciones Permitidas en Google Console**

   * En la [Google Cloud Console](https://console.cloud.google.com/), configura las **URIs de redirección autorizadas** para OAuth 2.0.

   Ejemplo para producción:

   ```
   https://tu-app.vercel.app/api/v1/auth/google/callback
   ```

   También puedes incluir la versión local para desarrollo:

   ```
   http://localhost:3000/api/v1/auth/google/callback
   ```

---

## 🌐 Variables de Entorno

Asegúrate de definir las siguientes variables de entorno tanto en **el backend** como en **la configuración del entorno de producción** (por ejemplo, Vercel Environment Variables o Netlify Environment Settings).

### 🔐 Backend (`.env` o variables del entorno):

```env
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_secret
GOOGLE_REDIRECT_URL=https://tu-app.vercel.app/api/v1/auth/google/callback

COOKIE_SECRET=tu_secreto_seguro
COOKIE_SESSION_NAME=access_token
FRONTEND_URL=https://tu-app.vercel.app
```

### 🌍 Frontend (React):

En Vercel o Netlify, puedes configurar:

```env
REACT_APP_API_BASE_URL=https://tu-api.vercel.app/api/v1
```

En el código, usa esta variable:

```tsx
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api/v1";
```

---

## 🍪 Configuración de Cookies en Producción

Asegúrate de establecer las cookies como **seguras** y compatibles con entornos cross-origin (si el frontend y backend están en dominios diferentes):

```ts
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none" as const, // importante para cookies cross-origin
  maxAge: 60 * 60 * 24 * 7, // 7 días
  path: "/"
};
```

* `httpOnly`: impide el acceso a cookies desde JavaScript.
* `secure`: solo se envía por HTTPS.
* `sameSite: "none"`: necesario si el frontend está en otro dominio que el backend.

---

## 🛡️ Configuración CORS en el Backend

Permite solicitudes con credenciales desde tu dominio de frontend:

```ts
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // ejemplo: "https://tu-app.vercel.app"
    credentials: true
  })
);
```

---

## 🧪 Tips para Despliegue en Vercel / Netlify

### En Vercel:

* Define variables de entorno en **Project Settings > Environment Variables**.
* Puedes tener diferentes valores para `development`, `preview` y `production`.
* Asegúrate de que tanto frontend como backend están desplegados y los dominios coinciden con lo configurado en Google.

### En Netlify:

* Agrega las variables en **Site settings > Environment variables**.
* Si usas funciones de Netlify para el backend, asegúrate de que soportan cookies y CORS correctamente.

---

## 🧾 Resumen del Flujo en Producción

1. El frontend redirige a `/api/v1/auth/google`.
2. Google redirige a `/auth/google/callback` del backend.
3. El backend valida y genera un token JWT, lo guarda en una **cookie httpOnly**.
4. El frontend hace solicitudes con `credentials: "include"` y obtiene el estado de sesión con `/auth/test`.
5. Si el token es válido, se considera que el usuario está autenticado.

---

Aquí tienes los ejemplos para un archivo `.env.example` y las configuraciones necesarias en `vercel.json` o `netlify.toml` para que puedas configurar fácilmente tu proyecto en producción.

### 🌍 `.env.example`

Este archivo muestra las variables de entorno necesarias para el backend, las cuales puedes copiar y ajustar según tu configuración.

```env
# .env.example

# Google OAuth 2.0
GOOGLE_CLIENT_ID=tu-client-id-de-google
GOOGLE_CLIENT_SECRET=tu-client-secret-de-google
GOOGLE_REDIRECT_URL=https://tu-app.vercel.app/api/v1/auth/google/callback

# Cookie Settings
COOKIE_SECRET=tu-secreto-de-cookie
COOKIE_SESSION_NAME=access_token
FRONTEND_URL=https://tu-app.vercel.app

# API Base URL (frontend)
REACT_APP_API_BASE_URL=https://tu-api.vercel.app/api/v1
```

**Nota:** Recuerda que debes reemplazar los valores con tus propias credenciales. Si usas este archivo, asegúrate de agregar `.env` al archivo `.gitignore` para que no se suban las credenciales a tu repositorio.

### 🌐 `vercel.json`

Si estás usando Vercel, puedes agregar un archivo `vercel.json` para configurar correctamente las redirecciones y el comportamiento de tu aplicación.

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/react"
    },
    {
      "src": "backend/package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/v1/auth/google",
      "dest": "/backend/api/v1/auth/google"
    },
    {
      "src": "/api/v1/auth/google/callback",
      "dest": "/backend/api/v1/auth/google/callback"
    },
    {
      "src": "/api/v1/auth/test",
      "dest": "/backend/api/v1/auth/test"
    }
  ],
  "env": {
    "GOOGLE_CLIENT_ID": "@google_client_id",
    "GOOGLE_CLIENT_SECRET": "@google_client_secret",
    "GOOGLE_REDIRECT_URL": "https://tu-app.vercel.app/api/v1/auth/google/callback",
    "COOKIE_SECRET": "@cookie_secret",
    "COOKIE_SESSION_NAME": "access_token",
    "FRONTEND_URL": "https://tu-app.vercel.app"
  }
}
```

**Detalles:**

* Configura el `routes` para que las rutas de autenticación sean manejadas por tu backend.
* Usa las variables de entorno definidas en **Vercel Dashboard** en lugar de directamente en el archivo `vercel.json`.
* Recuerda que debes configurar estas variables en **Vercel Dashboard > Environment Variables**.

---

### 🚀 `netlify.toml`

Si estás usando **Netlify** para el despliegue, puedes usar un archivo `netlify.toml` para configurar el comportamiento de tu aplicación.

```toml
[build]
  publish = "frontend/build"
  functions = "backend/functions"
  command = "npm run build"

[dev]
  functions = "backend/functions"

[[redirects]]
  from = "/api/v1/auth/google"
  to = "/backend/api/v1/auth/google"
  status = 200

[[redirects]]
  from = "/api/v1/auth/google/callback"
  to = "/backend/api/v1/auth/google/callback"
  status = 200

[[redirects]]
  from = "/api/v1/auth/test"
  to = "/backend/api/v1/auth/test"
  status = 200

[env]
  GOOGLE_CLIENT_ID = "tu-client-id-de-google"
  GOOGLE_CLIENT_SECRET = "tu-client-secret-de-google"
  GOOGLE_REDIRECT_URL = "https://tu-app.netlify.app/api/v1/auth/google/callback"
  COOKIE_SECRET = "tu-secreto-de-cookie"
  COOKIE_SESSION_NAME = "access_token"
  FRONTEND_URL = "https://tu-app.netlify.app"
```

**Detalles:**

* Configura los `redirects` para redirigir las rutas de autenticación correctamente hacia las funciones del backend en Netlify.
* También puedes definir las variables de entorno directamente en este archivo o configurarlas desde el **Netlify Dashboard**.

---

### 🌐 Otros Archivos para Despliegue

Si tu backend está separado de tu frontend, asegúrate de que la URL de la API se configure correctamente tanto en **Frontend** como en **Backend** (en este caso, las variables de entorno deben estar sincronizadas en ambos lados).

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
