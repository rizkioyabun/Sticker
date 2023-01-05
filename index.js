const {
 default: makeWASocket,
 useSingleFileAuthState,
 downloadMediaMessage,
 DisconnectReason
} = require("@adiwajshing/baileys");
const {
 Boom
} = require("@hapi/boom");
const P = require("pino");

// Exif
const {
 writeExifImg
} = require("./lib/exif.js");

// Session
const {
 state, saveState
} = useSingleFileAuthState("sessions.json");

const logger = P();

function runBot() {
 const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,
  logger: P({
   level: "silent"
  })
 });

 // Connection
 sock.ev.on("connection.update", ({
  connection, lastDisconnect
 }) => {
  if (connection === "close") {
   const error = new Boom(lastDisconnect.error);
   const alasanError = error?.output?.statusCode;
   if (alasanError === DisconnectReason.loggedOut) {
    sock.logout();
   } else {
    runBot();
   }
  } else {
   console.log("Connection Opened");
  }
 });

 sock.ev.on("messages.upsert",
 async({
  messages, type
 }) => {
  const msg = messages[0];
  console.log(msg);
  if (!msg.message || msg.key.remoteJid === "status@broadcast" || msg.key.fromMe || !msg.message.imageMessage) return;
  let caption = msg.message.imageMessage.caption;
  let buffer = await downloadMediaMessage(msg, "buffer", {}, {
   logger
  });
  buffer = await writeExifImg(buffer, {
   packname: "",
   author: "Rizki Setia"
  });

  // Command
  if (caption === 's') {
   sock.sendMessage(msg.key.remoteJid, {
    sticker: {
     url: buffer
    }
   });
  }
 });

 sock.ev.on("creds.update",
 saveState);
}

runBot();