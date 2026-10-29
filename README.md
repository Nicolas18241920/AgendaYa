# AgendaYa!

Sistema de gestión y citas para PyMEs de servicios. Permite al negocio administrar su catálogo de servicios, especialistas y horarios, y a sus clientes reservar citas en línea sin solapamientos, con notificaciones por correo y un panel de indicadores.

Proyecto Informático - Ingeniería Informática, Universidad Autónoma de Occidente (grupo PI-GRUPO-6).

## Funcionalidades (épicas)

| Código | Épica | Objetivo |
|---|---|---|
| EP-01 | Configuración de administración y catálogo | Parametrizar servicios, precios, tiempos de atención y especialistas |
| EP-02 | Agendamiento de citas en tiempo real | Consultar disponibilidad y reservar sin solapamientos |
| EP-03 | Notificaciones y autogestión del cliente | Confirmación y recordatorio por correo; cancelar o reagendar |
| EP-04 | Dashboard de indicadores y agenda interna | Visibilidad operativa: citas del día, estados e indicadores de ocupación |

## Stack tecnológico

- **Frontend:** React.js (carpeta `/frontend`)
- **Backend:** Node.js + Express, API REST (carpeta `/Backend`)
- **Base de datos:** PostgreSQL
- **Control de versiones:** Git y GitHub (Pull Requests con revisión)
- **Gestión del proyecto:** Jira (espacio PI-GRUPO-6)

## Arquitectura

Arquitectura web desacoplada en capas (cliente-servidor): el frontend consume la API REST del backend por HTTPS/JSON, y el backend persiste en PostgreSQL y delega el envío de correos a un servicio transaccional externo.

## Estructura del repositorio

```
AgendaYa/
├── Backend/    API REST (Node.js + Express)
├── frontend/   Aplicación web (React)
├── .gitignore
└── README.md
```

## Ejecución en local

> Ajustar los comandos a los scripts reales de cada `package.json`.

```bash
# Backend
cd Backend
npm install
npm start

# Frontend (en otra terminal)
cd frontend
npm install
npm start
```

Las variables de entorno (conexión a PostgreSQL, claves de servicios externos) van en un archivo `.env` que **no se sube al repositorio**.

## Estrategia de ramas

`main` contiene siempre la versión estable y está protegida: solo recibe cambios mediante Pull Request aprobado por un revisor distinto del autor.

```
main
 |
 +-- feature/hu03-horario-general
 +-- feature/hu04-horarios-especialista
 +-- feature/hu09-correo-confirmacion
 +-- feature/hu14-dashboard-metricas
 +-- fix/<descripcion-corta>
 +-- docs/<descripcion-corta>
```

Flujo de trabajo:

```
feature/hu<n>-<nombre>  ->  Pull Request  ->  Code Review  ->  Aprobación  ->  merge a main
```

- Una rama por historia de usuario (o tarea de una HU) del sprint en curso.
- El nombre de la rama, los commits y el PR deben ser trazables a la HU (por ejemplo, HU-03 / PIG6-13).

## Convención de commits

Formato: `<tipo>(<alcance opcional>): <descripción corta en imperativo>`

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de error |
| `docs` | Cambios de documentación |
| `test` | Creación o ajuste de pruebas |
| `refactor` | Mejora interna sin cambiar el comportamiento |
| `style` | Formato o estilo sin impacto funcional |
| `build` | Dependencias, empaquetado o compilación |
| `ci` | Automatización o integración continua |
| `chore` | Tareas de mantenimiento |
| `perf` | Mejora de rendimiento |

Ejemplos:

```
feat(horarios): agregar modelo de pausas operativas (HU-03)
fix(agenda): corregir validación de franjas solapadas
docs(readme): agregar estrategia de ramas
```

## Equipo

| Integrante | Cuenta de GitHub |
|---|---|
| Nicolás García Torres | Nicolas18241920 |
| Juan Felipe Murillo | JFMurillo-cop |
| Cristian Muñoz | CristianMP355 |
| Samuel Salazar | SamuelSalz |
