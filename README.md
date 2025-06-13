# SiriusTools

###### **EN DESARROLLO**

_Es un conjunto de herramientas en un solo lugar, simplemente para optimizar tiempo y no temer a los virus de las paginas Youtube -> MP3 o otras que se me vayan ocurriendo xd, podrás:_

• 🎶 **Descargar música de alta calidad**: Descarga audio desde YouTube y otros servicios de streaming directamente a tu PC de forma segura y rápida.
• **Más herramientas en desarrollo**: Continuamente agregamos nuevas funcionalidades para mejorar tu experiencia.

## Construido con 🛠️

- [Node.js](https://nodejs.org/) - Entorno de ejecución para JavaScript
- [HTML] - Estructura de la interfaz de usuario
- [CSS] - Estilos y diseño responsivo

## Instalación 🔧

### Instalación estándar

Sigue estos pasos para instalar y ejecutar SiriusTools en tu sistema:

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/ViceAguilera/SiriusTools.git
   cd SiriusTools
   ```

2. **Instala las dependencias necesarias**
   ```bash
   npm install
   ```

3. **Inicia la aplicación**
   ```bash
   npm run start
   ```

### Instalación con Docker 🐳

Para usuarios que prefieren usar contenedores Docker:

1. **Requisitos previos**
   Asegúrate de tener Docker instalado en tu sistema:
   - [Docker Desktop](https://www.docker.com/products/docker-desktop) para Windows/Mac
   - [Docker Engine](https://docs.docker.com/engine/install/) para Linux

2. **Construye la imagen Docker**
   ```bash
   docker build -t sirius-tool .
   ```

3. **Ejecuta el contenedor**
   ```bash
   docker run -d --name sirius-tool-container --env-file .env sirius-tool
   ```

4. **Alternativa con Docker Compose**
   
   Para una gestión más sencilla, crea un archivo `docker-compose.yml`:
   ```yaml
   version: '3.8'
   services:
     sirius-tool:
       build: .
       container_name: sirius-tool
       env_file:
         - .env
       restart: unless-stopped
   ```
   
   Luego ejecuta:
   ```bash
   docker-compose up -d
   ```

## Licencia 📄

Este proyecto está bajo el _MIT_ - mira el archivo [LICENSE](LICENSE) para detalles

## Autor ✒️
[**Vicente Aguilera Arias**](https://github.com/ViceAguilera)