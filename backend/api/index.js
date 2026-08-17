"use strict";

// Vercel Function entrypoint for the QUIZZY Express API.
// The compiled application is imported from the build output, and the
// MongoDB connection is established lazily on the first request so cold
// starts remain fast while subsequent requests reuse the connection.

const serverModule = require("../dist/server");
// The Vercel bundler may re-shape the compiled module (named export, default
// export, or the app instance returned directly), so resolve the Express app
// from whichever shape is present.
let app = serverModule.app || (serverModule.default && (serverModule.default.app || serverModule.default)) || serverModule;
if (typeof app !== "function") {
  console.error(
    "Serverless adapter diagnostics",
    {
      moduleKeys: Object.keys(serverModule || {}),
      defaultType: typeof (serverModule && serverModule.default),
      defaultKeys: serverModule && serverModule.default ? Object.keys(serverModule.default) : [],
    }
  );
}
const databaseModule = require("../dist/config/database");
const connectDatabase = databaseModule.connectDatabase || (databaseModule.default && databaseModule.default.connectDatabase);
const envModule = require("../dist/config/env");
const validateProductionConfig = envModule.validateProductionConfig || (envModule.default && envModule.default.validateProductionConfig);

// Respond with a plain JSON body without relying on the Express `res`
// decorators, which are only attached after `app(req, res)` has been called.
// Calling `res.status(...)` here would throw on Vercel's serverless runtime.
function sendServiceUnavailable(res, message) {
  const body = JSON.stringify({
    success: false,
    error: { code: "SERVICE_UNAVAILABLE", message },
  });
  res.writeHead(503, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

let connection;

function ensureDatabaseConnection() {
  if (!connection) {
    connection = connectDatabase().catch((error) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}

module.exports = async function handler(req, res) {
  try {
    validateProductionConfig();
    await ensureDatabaseConnection();
    app(req, res);
  } catch (error) {
    console.error("Vercel request initialization failed", error);
    if (!res.headersSent) {
      sendServiceUnavailable(res, "The QUIZZY API is temporarily unavailable");
    }
  }
};
