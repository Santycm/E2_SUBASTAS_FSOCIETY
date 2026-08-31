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

La estructura actual del proyecto utiliza una organización MVC para definir y exponer los endpoints de la API durante esta primera etapa:

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
│   ├── auctions.ts
│   ├── categories.ts
│   ├── orders.ts
│   └── users.ts
│
├── routes/
│   ├── auctions.ts
│   ├── auth.ts
│   ├── categories.ts
│   ├── orders.ts
│   ├── payments.ts
│   └── users.ts
│
└── app.ts
```

Los archivos ubicados en `data/` contienen actualmente información de prueba en memoria utilizada para validar los contratos y respuestas de la API.

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

#### Registro

`POST /api/v1/auth/register`

Body:

```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123"
}
```

#### Inicio de sesión

`POST /api/v1/auth/login`

Body:

```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

La respuesta incluye los datos básicos del usuario y un token de prueba.

> La autenticación utilizada actualmente es únicamente un mock. La generación y validación real del token será implementada posteriormente.

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

#### Listado de subastas

`GET /api/v1/auctions`

El listado permite utilizar los siguientes parámetros de consulta:

| Parámetro    | Descripción                      | Ejemplo   |
| ------------ | -------------------------------- | --------- |
| `categoryId` | Filtrar por categoría            | `cat-001` |
| `status`     | Filtrar por estado               | `OPEN`    |
| `page`       | Número de página                 | `1`       |
| `limit`      | Cantidad de registros por página | `10`      |

Ejemplo:

```text
GET /api/v1/auctions?categoryId=cat-001&status=OPEN&page=1&limit=10
```

La respuesta incluye los registros encontrados y la información de paginación:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

#### Publicar una subasta

`POST /api/v1/auctions`

Body:

```json
{
  "title": "MacBook Pro 14",
  "description": "MacBook Pro de 14 pulgadas en excelente estado.",
  "categoryId": "cat-001",
  "basePrice": 5000000,
  "minimumIncrement": 100000,
  "closesAt": "2026-09-15T20:00:00.000Z"
}
```

### Pujas

Las operaciones relacionadas con las pujas se mantienen como recursos de una subasta, por lo que no se define un archivo de rutas independiente para `bids`.

#### Registrar una puja

`POST /api/v1/auctions/:id/bids`

Body:

```json
{
  "amount": 5600000
}
```

#### Historial de pujas

`GET /api/v1/auctions/:id/bids`

Retorna las pujas asociadas a la subasta indicada.

> Actualmente las pujas se almacenan en memoria como información de prueba. Las reglas de aceptación y rechazo serán implementadas posteriormente en la capa de dominio.

### Órdenes de pago

| Método | Endpoint             | Descripción                   |
| ------ | -------------------- | ----------------------------- |
| GET    | `/api/v1/orders`     | Consultar las órdenes de pago |
| GET    | `/api/v1/orders/:id` | Consultar una orden de pago   |

Las órdenes de pago se generan actualmente como datos de prueba asociados a subastas finalizadas.

### Pagos

| Método | Endpoint                   | Descripción                      |
| ------ | -------------------------- | -------------------------------- |
| POST   | `/api/v1/payments/webhook` | Recibir una notificación de pago |

> El webhook actualmente funciona únicamente como mock de respuesta. La validación de autenticidad, idempotencia y procesamiento de las notificaciones será implementada posteriormente.

## Respuestas de error

Los endpoints que requieren identificar un recurso inexistente utilizan una estructura uniforme:

```json
{
  "error": {
    "code": "AUCTION_NOT_FOUND",
    "message": "Auction not found"
  }
}
```

Actualmente se contemplan códigos específicos para recursos no encontrados y credenciales inválidas. El formato definitivo de errores será consolidado posteriormente junto con la implementación de las reglas de negocio.

## Estado actual de la API

En esta etapa:

* Los endpoints REST principales se encuentran definidos.
* Las rutas utilizan el prefijo `/api/v1`.
* Las respuestas utilizan datos de prueba almacenados en memoria.
* Los endpoints de consulta, creación y cancelación cuentan con respuestas mock.
* Los filtros y la paginación del listado de subastas están definidos.
* Las pujas se registran temporalmente en memoria.
* Las órdenes de pago cuentan con información de prueba asociada a subastas finalizadas.
* El webhook de pagos cuenta con una respuesta mock.
* La autenticación y los tokens todavía no tienen comportamiento real.
* Las reglas de negocio todavía no se encuentran implementadas.
* No se ha implementado persistencia en base de datos.
* No se han implementado WebSockets.

Esta etapa tiene como objetivo establecer y probar el contrato inicial de la API antes de incorporar la lógica de negocio y la arquitectura definitiva.

## Arquitectura

La primera etapa utiliza una estructura MVC con el objetivo de definir y probar el contrato inicial de la API.

Posteriormente, el proyecto evolucionará hacia una **arquitectura hexagonal**, con una separación explícita entre:

* Dominio
* Aplicación
* Infraestructura

Las reglas de negocio serán responsabilidad del dominio, mientras que las tecnologías externas como Express, la base de datos, WebSockets y los servicios de pago estarán aisladas mediante los mecanismos de la arquitectura.

## Licencia

Este proyecto se desarrolla con fines académicos.
