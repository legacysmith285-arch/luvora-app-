import type { Config } from "@netlify/functions";
import { or, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { verifyPassword } from "../../lib/auth.js";

const INVALID = "That username or password doesn't match an account.";

export default async (req: Request) => {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ message: "Invalid request body." }, { status: 400 });
  }

  const identifier =
    typeof payload.identifier === "string" ? payload.identifier.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!identifier || !password) {
    return Response.json(
      { message: "Please enter your username or email and your password." },
      { status: 400 },
    );
  }

  const [user] = await db
    .select({
      fullName: users.fullName,
      username: users.username,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ message: INVALID }, { status: 401 });
  }

  return Response.json({
    message: `Welcome back, ${user.fullName}!`,
    user: { username: user.username, fullName: user.fullName },
  });
};

export const config: Config = {
  path: "/api/login",
  method: "POST",
};
