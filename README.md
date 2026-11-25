# Cryptoid Evolution

Cryptoid Evolution is the space arcade game by Trojan Wolf Games. It includes a boss campaign, collectible ships, earned Shards, a galaxy map, account saves and Pi integration. Testnet and the Mainnet preview are separate environments. Planned purchases and NFT delivery remain subject to their server-side release checks.

Eigene [Nutzungsbedingungen / Terms of Service](./TERMS_OF_SERVICE.md) und [Datenschutzerklärung / Privacy Policy](./PRIVACY_POLICY.md). Die bestehende [Softwarelizenz](./LICENSE.md) bleibt davon getrennt. Rechtstexte sind keine Bestätigung einer rechtlichen Prüfung.

## Grundlage


The project was originally based on the Pi Demo App. The current application uses the Pi SDK in the frontend and verifies Pi identities and payments on the backend.

It is composed of two major parts:

- **frontend**: a single-page frontend app (built with React and Vite)
- **backend**: an Express API with MongoDB, account saves, payment verification and operator controls

## Initial Development

Read [`doc/development.md`](./doc/development.md) to get started and learn how to run this app in development.

> **WARNING**
>
> The demo app uses express session cookies which, in the Sandbox environment, are not correctly saved on the client on some browsers.
> To properly test all of the features of the Demo App, use Mozilla Firefox.

## Deployment

Read [`doc/deployment.md`](./doc/deployment.md) to learn how to deploy this app on a server using Docker and docker-compose.

Für die Spieloberfläche und die API-Funktion auf Vercel siehe [`doc/vercel.md`](./doc/vercel.md). Der aktuelle Abgleich mit den offiziellen Pi-Next- und Mainnet-Anforderungen steht in [`docs/pi-next-readiness-20261125.md`](./docs/pi-next-readiness-20261125.md).

## Admin-Zentrale

Die Eigentümeroberfläche unter `/admin` bietet direkte Schiffs-, Level-, Boss- und Audiotests sowie geschützte Zahlungseingänge und CSV-Downloads. Details: [`doc/admin.md`](./doc/admin.md).

## Flows

To dive into the implementation of the flows that support the demo app features, please refer to
[Pi integration flows (historical foundation)](./FLOWS.md). Current release behavior and restrictions are defined by the implementation and the dated readiness documentation above.
