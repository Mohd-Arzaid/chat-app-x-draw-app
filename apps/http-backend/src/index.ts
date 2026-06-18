import express from "express";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  CreateUserSchema,
  LoginSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import bcrypt from "bcrypt";

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.json({
      message: "Incorrect inputs",
    });
  }

  // hash the password using bcrypt
  const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
  try {
    const user = await prismaClient.user.create({
      data: {
        email: parsedData.data.email,
        password: hashedPassword,
        name: parsedData.data.name,
      },
    });
    res.json({
      userId: user.id,
    });
  } catch (error) {
    res.status(411).json({
      message: "User already exists with this email",
    });
  }
});

app.post("/login", async (req, res) => {
  const parsedData = LoginSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect inputs",
    });
    return;
  }

  // TODO :  Compare the password with the hashed password

  const user = await prismaClient.user.findFirst({
    where: {
      email: parsedData.data.email,
    },
  });

  if (!user) {
    res.status(403).json({
      message: "Not Authorized",
    });
    return;
  }

  const token = jwt.sign(
    {
      userId: user?.id,
    },
    JWT_SECRET
  );
  res.json({
    token,
  });
});

app.post("/create-room", middleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect inputs",
    });
    return;
  }

  // @ts-ignore
  const userId = req.userId;

  try {
    const room = await prismaClient.room.create({
      data: {
        slug: parsedData.data.slug,
        userId: userId,
      },
    });

    res.json({
      roomId: room.id,
    });
  } catch (error) {
    res.status(403).json({
      message: "Room already exists with this slug",
    });
    return;
  }
});

// Get the last 50 messages from a room, ordered by id in descending order.
app.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);

  try {
    const messages = await prismaClient.chat.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        id: "desc",
      },
      take: 50,
    });
    res.json({
      messages,
    });
  } catch (error) {
    res.status(403).json({
      message: "No messages found",
    });
  }
});


// Get the room by slug
app.get("/room/:slug", async (req, res) => {
  const slug = req.params.slug;
  try {
    const room = await prismaClient.room.findUnique({
      where: {
        slug,
      },
    });

    res.json({
      room,
    });
  } catch (error) {
    res.status(403).json({
      message: "Room not found",
    });
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
