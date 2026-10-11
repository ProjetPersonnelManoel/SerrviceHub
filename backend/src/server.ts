// Doit être chargé en premier : les autres modules lisent process.env à l'import
import "dotenv/config";

import fs from "fs";
import https from "https";
import { createApp } from "./app";

const app = createApp();
const port = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV === "development";

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const onListen = (protocol: string) => () => {
  console.log(`Listening on ${protocol}://localhost:${port}`);
  console.log("Ping    on ./api/ping");
  if (isDev) console.log("Swagger on ./swagger");
};

// HTTPS si les certificats SSL (Certbot) sont configurés, sinon HTTP (dev local)
if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
  const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };
  https.createServer(sslOptions, app).listen(port, onListen("https"));
} else {
  app.listen(port, onListen("http"));
}
