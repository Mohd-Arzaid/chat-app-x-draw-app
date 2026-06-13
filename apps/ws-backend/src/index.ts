import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "./config";


const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws, req) => {
  const url = req.url; // ws://localhost:8080?token=123123
  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]); // { token: "123123" }
  const token = queryParams.get("token") ?? "";
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded || !(decoded as JwtPayload).userId) {
    ws.close();
    return;
  }

  ws.on("message", () => {
    ws.send("Hello from server");
  });
});
