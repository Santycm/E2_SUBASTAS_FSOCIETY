# Plataforma de Subastas en Línea

API REST para una plataforma de subastas en línea que permite gestionar usuarios, categorías, subastas, ofertas, órdenes y pagos. Integra Mercado Pago para procesar pagos y utiliza Socket.IO para la comunicación en tiempo real de eventos relacionados con las subastas.

## Nombre de la materia

ELECTIVA II - DESARROLLO

## Nombre del proyecto

Plataforma de Subastas en Línea

## Equipo

FSOCIETY

## Integrantes

* Santiago Castaño Moreno

## Tecnologías

- **Node.js y TypeScript:** entorno de ejecución y lenguaje de desarrollo.
- **Express 5:** framework HTTP para exponer la API REST.
- **MongoDB y Mongoose:** almacenamiento y persistencia de datos.
- **Arquitectura hexagonal:** separación entre la lógica de negocio y los detalles de infraestructura.
- **JWT y bcrypt:** autenticación y protección de contraseñas.
- **Mercado Pago:** integración con la pasarela de pagos.
- **Socket.IO:** comunicación en tiempo real.
- **Swagger UI y OpenAPI:** documentación interactiva de la API.
- **Jest y Supertest:** pruebas unitarias, de integración y de la API HTTP.

## Requisitos previos

- Node.js y npm.
- Una instancia de MongoDB accesible.
- Credenciales de Mercado Pago para las funcionalidades de pago.

## Instalación

Clona el repositorio y accede al directorio del proyecto:

```bash
git clone https://github.com/Santycm/E2_SUBASTAS_FSOCIETY.git
cd E2_SUBASTAS_FSOCIETY
npm install
```

Configura las variables de entorno antes de iniciar la aplicación.

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```dotenv
PORT=5000
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=1d
JWT_ISSUER=subastas-issuer-app
JWT_AUDIENCE=subastas-app-audience
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
ALLOW_UNVERIFIED_WEBHOOK_RECONCILIATION=true
```

| Variable                                  | Descripción                                                                                                                                              |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                                    | Puerto HTTP de la aplicación.                                                                                                                            |
| `MONGODB_URI`                             | Cadena de conexión a MongoDB.                                                                                                                            |
| `JWT_SECRET`                              | Secreto utilizado para firmar y verificar los JWT.                                                                                                       |
| `JWT_EXPIRES_IN`                          | Tiempo de expiración de los tokens.                                                                                                                      |
| `JWT_ISSUER`                              | Emisor esperado de los JWT.                                                                                                                              |
| `JWT_AUDIENCE`                            | Audiencia esperada de los JWT.                                                                                                                           |
| `MERCADOPAGO_ACCESS_TOKEN`                | Credencial para crear y consultar pagos en Mercado Pago.                                                                                                 |
| `MERCADOPAGO_WEBHOOK_SECRET`              | Secreto utilizado para validar la firma de las notificaciones de Mercado Pago.                                                                           |
| `ALLOW_UNVERIFIED_WEBHOOK_RECONCILIATION` | Controla si se permite continuar con la reconciliación del pago cuando la validación de la firma del webhook falla, según las condiciones implementadas. |

Completa las variables con los valores correspondientes a tu entorno. No publiques el archivo `.env` ni almacenes credenciales reales en el repositorio.

**Importante:** `ALLOW_UNVERIFIED_WEBHOOK_RECONCILIATION=true` está destinado al entorno de demostración configurado para el proyecto. En producción debe establecerse en `false` y corregirse cualquier discrepancia en la validación criptográfica de las notificaciones.

## Ejecución

Iniciar el servidor en modo desarrollo:

```bash
npm run dev
```

Compilar el proyecto:

```bash
npm run build
```

Iniciar la aplicación compilada:

```bash
npm start
```

La aplicación utiliza el puerto configurado mediante `PORT`; por defecto, el servidor se ejecuta en el puerto `5000`.

## Arquitectura

El proyecto utiliza **arquitectura hexagonal (Ports and Adapters)** para separar el dominio y los casos de uso de los mecanismos externos de entrada y salida, como HTTP, MongoDB y Mercado Pago.

Esta organización permite mantener las reglas de negocio independientes de los frameworks y facilita las pruebas mediante implementaciones sustitutas de los puertos.

### Estructura general

```text
src/
├── app.ts
├── index.ts
├── application/
│   ├── errors/
│   └── use-cases/
├── domain/
│   ├── entities/
│   ├── ports/
│   ├── rules/
│   └── value-objects/
└── infrastructure/
    ├── http/
    │   ├── controllers/
    │   ├── docs/
    │   ├── middlewares/
    │   ├── routes/
    │   └── validators/
    ├── payments/
    │   └── mercadopago/
    ├── persistence/
    │   └── mongoose/
    ├── realtime/
    └── security/
```

### Dominio — `src/domain/`

Contiene los conceptos, las reglas y los contratos fundamentales del negocio. No debe depender de Express, Mongoose ni de la implementación concreta de Mercado Pago.

- **`entities/`:** entidades del negocio, como `Auction`, `Bid`, `Category`, `Order`, `Payment` y `User`.
- **`rules/`:** reglas y validaciones propias del dominio, por ejemplo, las condiciones para realizar ofertas, gestionar subastas y controlar órdenes.
- **`ports/`:** interfaces que definen las operaciones requeridas por los casos de uso, como consultar usuarios, registrar ofertas, acceder a pagos o publicar eventos.

### Aplicación — `src/application/`

Contiene los casos de uso que coordinan las operaciones de la plataforma. Cada caso de uso representa una acción concreta del sistema.

Los casos de uso se organizan por funcionalidad:

- **`auctions/`:** creación, consulta, cancelación y cierre de subastas.
- **`auth/`:** registro e inicio de sesión.
- **`bids/`:** registro y consulta de ofertas.
- **`categories/`:** creación y consulta de categorías.
- **`orders/`:** creación, consulta y expiración de órdenes.
- **`payments/`:** creación de pagos y procesamiento de webhooks.
- **`users/`:** consulta del perfil del usuario.

Los DTO de entrada y salida se ubican junto al caso de uso correspondiente cuando aplica. Los errores de aplicación se centralizan en `application/errors/application-error.ts`.

La capa de aplicación depende de las entidades, reglas y puertos del dominio. No necesita conocer los detalles de MongoDB, Express o del proveedor de pagos.

### Infraestructura — `src/infrastructure/`

Contiene los adaptadores que conectan el núcleo de la aplicación con tecnologías y servicios externos.

#### Adaptador HTTP — `http/`

Expone los casos de uso mediante la API REST.

- **`routes/`:** define las rutas y asocia los endpoints con sus controladores.
- **`controllers/`:** recibe las solicitudes HTTP, invoca los casos de uso y construye las respuestas.
- **`middlewares/`:** implementa funciones transversales, como autenticación, validación, manejo de errores y tratamiento de rutas inexistentes.
- **`validators/`:** valida los datos recibidos en los endpoints.
- **`docs/`:** contiene la documentación OpenAPI y la configuración de Swagger UI.

#### Adaptador de persistencia — `persistence/mongoose/`

Implementa los puertos de persistencia del dominio utilizando MongoDB y Mongoose.

- **`models/`:** define los modelos utilizados para persistir usuarios, categorías, subastas, ofertas, órdenes y pagos.
- **`repositories/`:** implementa las interfaces de los repositorios y traduce las operaciones solicitadas por la aplicación a consultas de base de datos.
- **`connection.ts`:** gestiona la conexión con MongoDB.

#### Adaptador de pagos — `payments/mercadopago/`

`mercado-pago.provider.ts` implementa la comunicación con Mercado Pago para crear y consultar operaciones de pago. De esta forma, los casos de uso dependen del puerto `PaymentProvider`, no directamente del SDK o de la API externa.

#### Adaptador de tiempo real — `realtime/`

Contiene la publicación de eventos de subastas y la configuración de Socket.IO. El puerto `AuctionEventPublisher` permite desacoplar los casos de uso de la tecnología de comunicación en tiempo real.

#### Adaptadores de seguridad — `security/`

Contiene las implementaciones concretas de los mecanismos de seguridad, como el hash de contraseñas mediante bcrypt y la generación y verificación de tokens JWT.

### Flujo de una solicitud

En una operación HTTP, el flujo general es:

1. La ruta recibe la solicitud y ejecuta los middlewares y validadores correspondientes.
2. El controlador interpreta la solicitud e invoca el caso de uso.
3. El caso de uso aplica las reglas de negocio y utiliza los puertos definidos por el dominio.
4. Los adaptadores de infraestructura implementan esos puertos mediante MongoDB, Mercado Pago u otros servicios.
5. El resultado vuelve al controlador, que genera la respuesta HTTP.

Esta separación permite probar los casos de uso sin iniciar un servidor HTTP ni conectarse necesariamente a los servicios externos.

## Procesamiento de pagos

La integración con Mercado Pago permite iniciar pagos asociados a las órdenes y actualizar su estado a partir de notificaciones webhook.

### Flujo general

1. El backend crea una orden local y solicita la creación de la operación de pago a Mercado Pago.
2. Se almacena la referencia externa correspondiente y se devuelve al cliente la información necesaria para continuar al checkout.
3. Mercado Pago envía una notificación webhook cuando se produce un evento relacionado con el pago.
4. El backend identifica el pago local mediante la referencia externa y consulta el estado de la operación directamente a Mercado Pago.
5. Se contrastan las referencias de la orden, los identificadores y el importe.
6. Cuando la respuesta externa corresponde a un estado terminal reconocido, se ejecuta la liquidación del pago y, si es aprobado, se actualiza la orden asociada.

Los estados externos reconocidos por el caso de uso incluyen `processed`, `failed` y `canceled`, que se traducen respectivamente a `APPROVED`, `REJECTED` y `CANCELLED`. Los estados no reconocidos o que todavía no son terminales no generan una liquidación.

### Validación de webhooks

La aplicación dispone de `MERCADOPAGO_WEBHOOK_SECRET` para validar la firma de las notificaciones. Durante la integración de demostración se contempló una opción de reconciliación debido a discrepancias entre las firmas de diferentes notificaciones.

Consultar el pago directamente mediante la API autenticada de Mercado Pago permite contrastar su estado y sus datos, pero no demuestra por sí solo que el webhook recibido sea auténtico.

Por esta razón:

- En producción se debe exigir la validación correcta de la firma.
- La reconciliación sin firma válida no debe considerarse un reemplazo equivalente de la validación criptográfica.
- Deben verificarse también la idempotencia, la concurrencia y los escenarios de reintento antes de utilizar el flujo en producción.

### Liquidación transaccional e idempotencia

La liquidación se implementa mediante el puerto:

`src/domain/ports/payment-settlement.repository.ts`

Este contrato define `SettlePaymentInput` y la operación `settle()`, que recibe las referencias del pago y de la orden, el identificador del pago externo, el identificador del evento, el estado final y la fecha de actualización.

Su implementación concreta se encuentra en:

`src/infrastructure/persistence/mongoose/repositories/mongoose-payment-settlement.repository.ts`

Esta implementación utiliza una transacción de MongoDB para agrupar las actualizaciones del pago y de la orden.

Entre sus controles se encuentran:

- Validación de los identificadores locales.
- Verificación de que el pago pertenezca a la orden indicada.
- Actualización condicional del pago únicamente si continúa en estado `PENDING`.
- Cambio de la orden a `PAID` cuando el pago es aprobado.
- Comprobación de la consistencia cuando el pago ya figura como aprobado.
- Rechazo de determinados cambios de estado incompatibles con la liquidación.

Estos controles ayudan a evitar liquidaciones repetidas y a mantener la consistencia entre pago y orden. No obstante, la seguridad completa frente a eventos duplicados y solicitudes concurrentes también depende de la configuración transaccional de MongoDB, los estados permitidos, los índices y las restricciones de unicidad, así como de las pruebas de concurrencia.

El campo `externalEventId` se almacena como referencia del evento procesado. Su presencia no implica, por sí sola, que exista una restricción única ni una deduplicación independiente por identificador de evento.

## Documentación de la API

La documentación se encuentra en `src/infrastructure/http/docs/` y está organizada en archivos YAML de OpenAPI.

- `openapi.yaml`: documento principal.
- `paths/`: definición de los endpoints por funcionalidad.
- `schemas/`: esquemas reutilizables de solicitudes y respuestas.
- `swagger.ts`: carga y combina los documentos para exponerlos mediante la aplicación.

Con el servidor en ejecución, accede a:

- **Swagger UI:** `http://localhost:5000/api-docs`
- **Documento OpenAPI en JSON:** `http://localhost:5000/api-docs/openapi.json`

Si cambias el puerto, sustituye `5000` por el valor configurado en `PORT`.

## Comunicación en tiempo real con WebSockets

La plataforma utiliza **Socket.IO** para comunicar cambios de las subastas a los clientes conectados. El servidor comparte el mismo servidor HTTP y puerto que la API REST.

### Conexión

El servidor Socket.IO se inicializa en `src/index.ts` y registra los manejadores de conexión definidos en `src/infrastructure/realtime/socket-server.ts`.

La configuración actual permite conexiones desde cualquier origen mediante `cors.origin: "*"`. El servidor escucha en el puerto configurado por `PORT`, cuyo valor predeterminado en `src/index.ts` es `3000`.

El cliente puede conectarse utilizando la biblioteca `socket.io-client`:

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Conectado:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Desconectado:", reason);
});
```

En producción, sustituye la URL por la dirección del servidor correspondiente.

### Salas de subastas

Los clientes pueden suscribirse a una sala para recibir las actualizaciones de una subasta específica. Las salas utilizan el formato `auction:{auctionId}`.

| Evento | Dirección | Descripción |
|---|---|---|
| `JOIN_AUCTION` | Cliente → servidor | Solicita unirse a la sala de una subasta. |
| `JOINED_AUCTION` | Servidor → cliente | Confirma que el cliente se unió a la sala. |
| `LEAVE_AUCTION` | Cliente → servidor | Solicita abandonar la sala de una subasta. |
| `SOCKET_ERROR` | Servidor → cliente | Informa un identificador de subasta inválido. |

#### Unirse a una subasta

El cliente envía el identificador de la subasta:

```typescript
socket.emit("JOIN_AUCTION", "auction-id");
```

Si el identificador es una cadena no vacía, el servidor incorpora el socket a la sala correspondiente y responde con `JOINED_AUCTION`:

```json
{
  "auctionId": "auction-id",
  "room": "auction:auction-id"
}
```

El identificador del ejemplo debe sustituirse por el ID real de la subasta.

Si el identificador no es válido, el servidor emite:

```json
{
  "message": "INVALID_AUCTION_ID"
}
```

Esta respuesta se envía mediante el evento `SOCKET_ERROR`.

#### Abandonar una subasta

El cliente puede dejar de recibir eventos de una sala enviando:

```typescript
socket.emit("LEAVE_AUCTION", "auction-id");
```

El servidor elimina el socket de la sala correspondiente. Actualmente, esta operación no genera un evento de confirmación.

### Eventos de negocio

Los eventos de negocio se publican a través del puerto `AuctionEventPublisher`, definido en `src/domain/ports/auction-event.publisher.ts`.

La implementación `SocketIoAuctionEventPublisher`, ubicada en `src/infrastructure/realtime/auction-event.publisher.ts`, utiliza Socket.IO para emitir los eventos a la sala de la subasta correspondiente.

#### `BID_PLACED`

Se emite cuando una oferta es aceptada y se actualiza la oferta actual de la subasta.

**Payload:**

```json
{
  "auctionId": "auction-id",
  "bidderId": "user-id",
  "amount": 150000,
  "currentBid": 150000
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `auctionId` | `string` | Identificador de la subasta. |
| `bidderId` | `string` | Identificador del usuario que realizó la oferta. |
| `amount` | `number` | Importe de la oferta aceptada. |
| `currentBid` | `number` | Importe de la oferta actual después de la actualización. |

**Ejemplo de recepción:**

```typescript
socket.on("BID_PLACED", (event) => {
  console.log("Nueva oferta:", event);
});
```

#### `BID_OUTBID`

Se emite cuando una nueva oferta aceptada supera la oferta de otro participante. Identifica al participante cuya oferta anterior ha sido superada.

**Payload:**

```json
{
  "auctionId": "auction-id",
  "outbidBidderId": "previous-bidder-id",
  "currentBid": 150000
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `auctionId` | `string` | Identificador de la subasta. |
| `outbidBidderId` | `string` | Identificador del participante cuya oferta fue superada. |
| `currentBid` | `number` | Importe de la nueva oferta actual. |

**Ejemplo de recepción:**

```typescript
socket.on("BID_OUTBID", (event) => {
  console.log("Tu oferta ha sido superada:", event);
});
```

Este evento se emite únicamente cuando la nueva oferta es aceptada y el participante anterior es distinto del nuevo oferente.

#### `AUCTION_CLOSED`

Se emite cuando una subasta abierta llega a su fecha de cierre y el caso de uso determina su estado final.

**Ejemplo de subasta cerrada con ganador:**

```json
{
  "auctionId": "auction-id",
  "status": "CLOSED",
  "winnerId": "winner-user-id"
}
```

**Ejemplo de subasta cerrada sin ofertas aceptadas:**

```json
{
  "auctionId": "auction-id",
  "status": "NO_BIDS"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `auctionId` | `string` | Identificador de la subasta. |
| `status` | `string` | Estado final: `CLOSED` o `NO_BIDS`. |
| `winnerId` | `string` opcional | Identificador del ganador cuando existe una oferta aceptada. |

**Ejemplo de recepción:**

```typescript
socket.on("AUCTION_CLOSED", (event) => {
  console.log("Estado final de la subasta:", event);
});
```

El evento `AUCTION_CLOSED` se publica cuando se ejecuta el caso de uso de cierre y se determina el resultado. No implica que exista un proceso automático independiente que cierre todas las subastas al llegar su fecha; el cierre depende de que se invoque el caso de uso.

### Arquitectura de los eventos

La comunicación sigue el patrón de puertos y adaptadores de la arquitectura hexagonal:

1. El caso de uso ejecuta la operación de negocio, por ejemplo, registrar una oferta.
2. El caso de uso invoca el puerto `AuctionEventPublisher`.
3. El adaptador `SocketIoAuctionEventPublisher` implementa el puerto y publica el evento mediante Socket.IO.
4. Los clientes conectados a la sala `auction:{auctionId}` reciben el evento correspondiente.

Esto permite mantener los casos de uso independientes de Socket.IO y facilita sustituir el mecanismo de comunicación o probar los casos de uso mediante implementaciones simuladas del puerto.

### Seguridad y limitaciones actuales

- **Autenticación:** la configuración compartida no implementa autenticación JWT para las conexiones Socket.IO.
- **Autorización de salas:**

## Pruebas

El proyecto utiliza **Jest** para ejecutar las pruebas automatizadas y **Supertest** para realizar solicitudes HTTP en las pruebas que lo requieren.

Ejecutar las pruebas configuradas para el comando principal:

```bash
npm test
```

Ejecutarlas en modo de observación:

```bash
npm run test:watch
```

Ejecutar todas las pruebas configuradas en `jest.coverage.config.cjs`:

```bash
npm run test:all
```

Generar el informe de cobertura:

```bash
npm run test:coverage
```

Ejecutar las pruebas de integración:

```bash
npm run test:integration
```

### Organización de las pruebas

Las pruebas se organizan según la responsabilidad de cada componente:

- **`tests/unit/domain/`:** pruebas unitarias de las reglas y la lógica del dominio, como las reglas de subastas, ofertas y órdenes.
- **`tests/application/`:** pruebas de los casos de uso y de sus interacciones con las dependencias.
- **`tests/infrastructure/http/controllers/`:** pruebas unitarias de los controladores HTTP, incluyendo validaciones de solicitudes, respuestas y manejo de errores.
- **`tests/integration/http/`:** pruebas de integración de los endpoints y del comportamiento HTTP.
- **`tests/integration/persistence/`:** pruebas de integración de los repositorios con MongoDB.
- **`tests/integration/setup.ts`:** configuración compartida para las pruebas de integración.

Las pruebas unitarias permiten verificar la lógica de los componentes de forma aislada, mientras que las pruebas de integración comprueban el comportamiento conjunto de los componentes involucrados en cada operación, incluyendo el acceso a MongoDB cuando corresponde.

Los resultados y porcentajes de cobertura pueden variar a medida que se incorporen o modifiquen pruebas. Para consultar los resultados actualizados, se deben ejecutar los comandos correspondientes.

## Comprobación de salud

El endpoint de salud permite verificar que la API responde:

```http
GET /health
```

Respuesta esperada:

```json
{
  "status": "ok"
}
```

Este endpoint confirma la respuesta del servicio HTTP; no debe interpretarse por sí solo como una comprobación integral de todos los servicios externos.

## Scripts disponibles

Los scripts configurados en el proyecto son:

| Comando | Propósito |
| --- | --- |
| `npm run dev` | Iniciar la aplicación en desarrollo. |
| `npm run build` | Compilar TypeScript. |
| `npm start` | Ejecutar la aplicación compilada. |
| `npm test` | Ejecutar las pruebas con la configuración principal de Jest. |
| `npm run test:watch` | Ejecutar las pruebas en modo de observación. |
| `npm run test:integration` | Ejecutar las pruebas con `jest.integration.config.cjs`. |
| `npm run test:all` | Ejecutar las pruebas con `jest.coverage.config.cjs`, sin activar explícitamente la opción de cobertura. |
| `npm run test:coverage` | Ejecutar las pruebas con `jest.coverage.config.cjs` y generar el informe de cobertura. |


## Consideraciones de seguridad

- No subas archivos `.env` con credenciales al repositorio.
- Utiliza secretos JWT robustos y credenciales de Mercado Pago correspondientes al entorno.
- Exige la validación criptográfica de los webhooks en producción.
- Verifica que las actualizaciones de pagos y órdenes sean consistentes ante reintentos y operaciones concurrentes.
- Protege las rutas privadas mediante los mecanismos de autenticación y autorización implementados.

## Licencia

Este proyecto utiliza la licencia ISC.
