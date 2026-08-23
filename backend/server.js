const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();

// ===============================
// CONFIGURATION
// ===============================

const PORT = Number(process.env.PORT || 3000);

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

console.log(
  "Meta Access Token loaded:",
  META_ACCESS_TOKEN ? "YES" : "NO"
);

console.log(
  "Meta Verify Token loaded:",
  META_VERIFY_TOKEN ? "YES" : "NO"
);

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());

app.use(express.json());

// ===============================
// HTTP SERVER
// ===============================

const server = http.createServer(app);

// ===============================
// SOCKET.IO
// ===============================

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let latestLead = null;

io.on("connection", (socket) => {
  if (latestLead) {
    socket.emit("new_lead", latestLead);
  }
});

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "Meta Lead Backend is running!",
  });
});

// ===============================
// TEST LEAD ENDPOINT
// ===============================

app.post("/lead", (req, res) => {
  console.log("=================================");
  console.log("TEST LEAD RECEIVED");
  console.log("=================================");

  console.log(JSON.stringify(req.body, null, 2));

  // Send test lead to React Native
  latestLead = req.body;
  io.emit("new_lead", req.body);

  res.json({
    success: true,
    message: "Lead received successfully",
    lead: req.body,
  });
});

// ===============================
// META WEBHOOK VERIFICATION
// ===============================

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("=================================");
  console.log("WEBHOOK VERIFICATION REQUEST");
  console.log("=================================");

  console.log("Mode:", mode);
  console.log("Verify token received:", token ? "YES" : "NO");

  if (
    mode === "subscribe" &&
    token === META_VERIFY_TOKEN
  ) {
    console.log("Webhook verified successfully");

    return res.status(200).send(challenge);
  }

  console.log("Webhook verification failed");

  return res.sendStatus(403);
});

// ===============================
// META LEAD WEBHOOK
// ===============================

app.post("/webhook", async (req, res) => {
  console.log("=================================");
  console.log("META WEBHOOK RECEIVED");
  console.log("=================================");

  console.log(
    JSON.stringify(req.body, null, 2)
  );

  try {
    // ===============================
    // GET ENTRY
    // ===============================

    const entry = req.body.entry?.[0];

    if (!entry) {
      console.log("No entry found in webhook");

      return res.sendStatus(200);
    }

    // ===============================
    // GET CHANGE
    // ===============================

    const change = entry.changes?.[0];

    if (!change) {
      console.log("No change found in webhook");

      return res.sendStatus(200);
    }

    // ===============================
    // CHECK FIELD
    // ===============================

    if (change.field !== "leadgen") {
      console.log(
        "Webhook field is not leadgen:",
        change.field
      );

      return res.sendStatus(200);
    }

    // ===============================
    // GET LEAD ID
    // ===============================

    const leadgenId = change.value?.leadgen_id;

    if (!leadgenId) {
      console.log("No leadgen_id found");

      return res.sendStatus(200);
    }

    console.log("Leadgen ID:", leadgenId);

    // ===============================
    // CHECK ACCESS TOKEN
    // ===============================

    if (!META_ACCESS_TOKEN) {
      console.error(
        "META_ACCESS_TOKEN is missing from .env"
      );

      return res.sendStatus(200);
    }

    // ===============================
    // RETRIEVE ACTUAL LEAD FROM META
    // ===============================

    console.log("Retrieving lead from Meta Graph API...");

    const response = await axios.get(
      `https://graph.facebook.com/v26.0/${leadgenId}`,
      {
        params: {
          access_token: META_ACCESS_TOKEN,
        },
      }
    );

    const leadData = response.data;

    // ===============================
    // PRINT ACTUAL LEAD
    // ===============================

    console.log("=================================");
    console.log("ACTUAL LEAD DATA");
    console.log("=================================");

    console.log(
      JSON.stringify(leadData, null, 2)
    );

    // ===============================
    // SEND ACTUAL LEAD TO REACT NATIVE
    // ===============================

    console.log(
      "Sending lead to React Native clients..."
    );

    latestLead = leadData;
    io.emit("new_lead", leadData);

    console.log(
      "Lead successfully sent to React Native"
    );

    return res.sendStatus(200);

  } catch (error) {
    console.error("=================================");
    console.error("META LEAD RETRIEVAL ERROR");
    console.error("=================================");

    if (error.response) {
      console.error(
        "Status:",
        error.response.status
      );

      console.error(
        "Meta error:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    } else {
      console.error(error.message);
    }

    // Always acknowledge the webhook
    return res.sendStatus(200);
  }
});

// ===============================
// SOCKET.IO CONNECTION
// ===============================

io.on("connection", (socket) => {
  console.log(
    "React Native client connected:",
    socket.id
  );

  socket.on("disconnect", () => {
    console.log(
      "React Native client disconnected:",
      socket.id
    );
  });
});

// ===============================
// START SERVER
// ===============================

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server running at http://localhost:${PORT}`
  );

  console.log(
    `Webhook endpoint: http://localhost:${PORT}/webhook`
  );
});