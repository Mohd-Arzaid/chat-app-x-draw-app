import express from "express";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import { CreateUserSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

const app = express();

app.post("/signup", (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.json({
      message: "Incorrect inputs",
    });
  }

  prismaClient.user.create({
    data: {
      email: parsedData.data.email,
      password: parsedData.data.password,
      name: parsedData.data.name,
    },
  });

  // db call
  res.json({
    userId: 123,
  });
});

app.post("/login", (req, res) => {
  const userId = 1;
  const token = jwt.sign(
    {
      userId,
    },
    JWT_SECRET
  );
  res.json({
    token,
  });
});

app.post("/create-room", middleware, (req, res) => {
  res.json({
    roomId: 123,
  });
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
