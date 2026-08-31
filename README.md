# E2_SUBASTAS_FSOCIETY

## Nombre de la materia

ELECTIVA II - DESARROLLO

## Nombre del proyecto

Plataforma de Subastas en Línea

## Equipo

FSOCIETY

## Integrantes

* Santiago Castaño Moreno

## Descripción

Plataforma web para la gestión de subastas públicas en línea, en la cual los usuarios registrados pueden publicar artículos para la venta y participar como postores en subastas durante un periodo determinado.

El sistema permite publicar subastas estableciendo un precio base, un incremento mínimo y una fecha de cierre. Los usuarios pueden realizar pujas siempre que cumplan las reglas definidas por el negocio, mientras que las nuevas ofertas y los cambios relevantes en las subastas serán comunicados en tiempo real mediante WebSockets.

Cuando una subasta llega a su fecha de cierre, se determina el ganador de acuerdo con la oferta más alta y, cuando corresponde, se genera una orden de pago asociada. El resultado de los pagos podrá ser informado posteriormente mediante un webhook proveniente de una pasarela externa.

El proyecto está orientado principalmente al correcto modelado y aplicación de las reglas de negocio, diferenciando las responsabilidades de la API REST, la comunicación mediante WebSockets y la recepción de notificaciones externas mediante webhooks.

## Tecnologías

* Node.js
* Express.js
* TypeScript
* REST API
* WebSockets
* Base de datos relacional
* Git
* GitHub

> La tecnología específica de persistencia, WebSockets y la implementación del frontend será definida durante el desarrollo del proyecto.

## Requerimientos

### Software

* Node.js
* npm
* Git

### Ejecución

1. Clonar el repositorio:

```bash
git clone https://github.com/Santycm/E2_SUBASTAS_FSOCIETY.git
```

2. Ingresar al proyecto:

```bash
cd E2_SUBASTAS_FSOCIETY
```

3. Instalar las dependencias:

```bash
npm install
```

4. Compilar el proyecto:

```bash
npm run build
```

5. Ejecutar en modo desarrollo:

```bash
npm run dev
```

El proyecto también dispone de un comando para ejecutar la aplicación compilada sin recarga automática:

```bash
npm run app
```

## Estructura del proyecto

La estructura inicial del proyecto se encuentra organizada mediante el patrón MVC, utilizado durante esta primera etapa para definir y exponer los endpoints de la API:

```text
src/
├── controllers/
│   ├── auctions.ts
│   ├── auth.ts
│   ├── bids.ts
│   ├── categories.ts
│   ├── orders.ts
│   ├── payments.ts
│   └── users.ts
│
├── data/
│
├── routes/
│   ├── auctions.ts
│   ├── auth.ts
│   ├── orders.ts
│   ├── payments.ts
│   └── users.ts
│
└── app.ts
```

Esta estructura corresponde a la etapa inicial del proyecto. Posteriormente será evolucionada hacia una arquitectura hexagonal, separando explícitamente las capas de dominio, aplicación e infraestructura.

## API

La API utiliza el prefijo:

```text
/api/v1
```

### Autenticación y usuarios

| Método | Endpoint                | Descripción                                 |
| ------ | ----------------------- | ------------------------------------------- |
| POST   | `/api/v1/auth/register` | Registrar un usuario                        |
| POST   | `/api/v1/auth/login`    | Iniciar sesión                              |
| GET    | `/api/v1/users/me`      | Consultar el perfil del usuario autenticado |

### Categorías

| Método | Endpoint                 | Descripción                          |
| ------ | ------------------------ | ------------------------------------ |
| GET    | `/api/v1/categories`     | Consultar las categorías disponibles |
| GET    | `/api/v1/categories/:id` | Consultar una categoría              |

### Subastas

| Método | Endpoint                      | Descripción                         |
| ------ | ----------------------------- | ----------------------------------- |
| GET    | `/api/v1/auctions`            | Consultar el listado de subastas    |
| POST   | `/api/v1/auctions`            | Publicar una nueva subasta          |
| GET    | `/api/v1/auctions/:id`        | Consultar el detalle de una subasta |
| POST   | `/api/v1/auctions/:id/cancel` | Cancelar una subasta                |
| POST   | `/api/v1/auctions/:id/bids`   | Registrar una puja                  |
| GET    | `/api/v1/auctions/:id/bids`   | Consultar el historial de pujas     |

### Órdenes de pago

| Método | Endpoint             | Descripción                               |
| ------ | -------------------- | ----------------------------------------- |
| GET    | `/api/v1/orders`     | Consultar las órdenes de pago del usuario |
| GET    | `/api/v1/orders/:id` | Consultar una orden de pago               |

### Pagos

| Método | Endpoint                   | Descripción                      |
| ------ | -------------------------- | -------------------------------- |
| POST   | `/api/v1/payments/webhook` | Recibir una notificación de pago |

> En esta primera etapa los endpoints se encuentran definidos y utilizan respuestas de prueba. La lógica de negocio, persistencia, autenticación, WebSockets y procesamiento de pagos serán incorporados durante las siguientes etapas del desarrollo.

## Arquitectura

La primera etapa utiliza una estructura MVC con el objetivo de definir y probar el contrato inicial de la API.

Posteriormente, el proyecto evolucionará hacia una **arquitectura hexagonal**, con una separación explícita entre:

* Dominio
* Aplicación
* Infraestructura

Las reglas de negocio serán responsabilidad del dominio, mientras que las tecnologías externas como Express, la base de datos, WebSockets y los servicios de pago estarán aisladas mediante los mecanismos de la arquitectura.

## Licencia

Este proyecto se desarrolla con fines académicos.
