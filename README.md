# SiriusTools

###### **EN DESARROLLO**

_Es un conjunto de herramientas en un solo lugar, simplemente para optimizar tiempo y no temer a los virus de las páginas YouTube -> MP3 o otras que se me vayan ocurriendo xd, podrás:_

• 🎶 **Descargar música de alta calidad**: Descarga audio desde YouTube y otros servicios de streaming directamente a tu PC de forma segura y rápida.
• **Más herramientas en desarrollo**: Continuamente agregamos nuevas funcionalidades para mejorar tu experiencia.

## Construido con 🛠️

### Backend
- [NestJS](https://nestjs.com/) - Framework progresivo de Node.js
- [TypeScript](https://www.typescriptlang.org/)

### Frontend  
- [React 19](https://react.dev/) 
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)

### DevOps
- [Docker](https://www.docker.com/)
- [ESLint](https://www.docker.com/)
- [Jest](https://jestjs.io/)

## Instalación 🔧

### Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [npm](https://www.npmjs.com/) (incluido con Node.js)
- [Git](https://git-scm.com/)

### Instalación Estándar (Desarrollo)

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/ViceAguilera/SiriusTools.git
   cd SiriusTools
   ```

2. **Instala las dependencias del proyecto completo**
   ```bash
   npm install
   ```

3. **Inicia el proyecto completo (Backend + Frontend)**
   ```bash
   npm run start:all
   ```

4. **O inicia cada servicio por separado:**
   
   **Backend** (en una terminal):
   ```bash
   npm run start:backend
   ```
   
   **Frontend** (en otra terminal):
   ```bash
   npm run start:frontend
   ```

5. **Accede a la aplicación**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Instalación con Docker 🐳

Para usuarios que prefieren usar contenedores Docker:

1. **Requisitos previos**
   Asegúrate de tener Docker instalado en tu sistema:
   - [Docker Desktop](https://www.docker.com/products/docker-desktop) para Windows/Mac
   - [Docker Engine](https://docs.docker.com/engine/install/) para Linux

2. **Clona el repositorio**
   ```bash
   git clone https://github.com/ViceAguilera/SiriusTools.git
   cd SiriusTools
   ```

3. **Ejecuta con Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Accede a la aplicación**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

5. **Para detener los contenedores**
   ```bash
   docker-compose down
   ```

### Scripts Disponibles

```bash
# Ejecutar ambos servicios simultáneamente
npm run start:all

# Ejecutar solo el backend
npm run start:backend

# Ejecutar solo el frontend  
npm run start:frontend

# Instalar dependencias en ambos proyectos
npm install

# Construir para producción (desde cada directorio)
cd backend && npm run build
cd frontend && npm run build

# Ejecutar tests
cd backend && npm run test
```

## Estructura del Proyecto 📁

```
SiriusTools/
├── backend/                 # Servidor NestJS
│   ├── src/                # Código fuente del backend
│   ├── dist/               # Archivos compilados
│   ├── test/               # Tests del backend
│   ├── Dockerfile          # Configuración Docker del backend
│   └── package.json        # Dependencias del backend
├── frontend/               # Cliente React
│   ├── src/                # Código fuente del frontend
│   ├── public/             # Archivos estáticos
│   ├── Dockerfile          # Configuración Docker del frontend
│   └── package.json        # Dependencias del frontend
├── docker-compose.yml      # Configuración de servicios Docker
├── package.json            # Configuración del monorepo
└── README.md              # Este archivo
```
## Licencia 📄

Este proyecto está bajo la licencia _MIT_ - mira el archivo [LICENSE](LICENSE) para detalles

## Autor ✒️
[**Vicente Aguilera Arias**](https://github.com/ViceAguilera)