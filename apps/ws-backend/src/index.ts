import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  userId: string;
  ws: WebSocket;
  rooms: string[];
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !(decoded as JwtPayload).userId) {
      return null;
    }
    return (decoded as JwtPayload).userId;
  } catch (error) {
    return null;
  }
}

wss.on("connection", (ws, req) => {
  const url = req.url; // ws://localhost:8080?token=123123
  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]); // { token: "123123" }
  const token = queryParams.get("token") ?? "";

  const userId = checkUser(token);
  if (userId === null) {
    ws.close();
    return null;
  }

  users.push({
    userId,
    ws,
    rooms: [],
  });

  ws.on("message", (data) => {
    const parsedData = JSON.parse(data.toString());

    // Join Room
    if (parsedData.type === "join-room") {
      const user = users.find((user) => user.ws === ws);
      user?.rooms.push(parsedData.roomId);
    }

    // Leave Room
    if (parsedData.type === "leave-room") {
      const user = users.find((user) => user.ws === ws);
      if (user) {
        user.rooms = user.rooms.filter((room) => room !== parsedData.roomId);
      }
    }

    //Send Message
    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      //broadcast message to same room users
      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message,
              userId,
              roomId,
            })
          );
        }
      });
    }
  });
});
