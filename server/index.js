const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "../clientechat/")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../clientechat/index.html"));
});

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on("mensaje", (data) => {
    io.emit("mensaje", {
      nombre: data.nombre,
      texto: data.texto,
      id: socket.id.slice(0, 5),
    });
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
