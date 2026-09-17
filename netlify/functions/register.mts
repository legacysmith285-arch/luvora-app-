import type { Config } from "@netlify/functions";
import { or, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { hashPassword, validateRegistration } from "../../lib/auth.js";

export default async (req: Request) => {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ message: "Invalid request body." }, { status: 400 });
  }

  const { errors, values } = validateRegistration(payload);
  if (Object.keys(errors).length > 0) {
    return Response.json(
      { message: "Please check the highlighted fields.", errors },
      { status: 400 },
    );
  }

  const taken = await db
    .select({ username: users.username, email: users.email })
    .from(users)
    .where(or(eq(users.username, values.username), eq(users.email, values.email)));

  const conflicts: Record<string, string> = {};
  for (const row of taken) {
    if (row.username === values.username) conflicts.username = "That username is already taken.";
    if (row.email === values.email) conflicts.email = "An account with that email already exists.";
  }
  if (Object.keys(conflicts).length > 0) {
    return Response.json(
      { message: "Please check the highlighted fields.", errors: conflicts },
      { status: 409 },
    );
  }

  const [user] = await db
    .insert(users)
    .values({
      fullName: values.fullName,
      username: values.username,
      email: values.email,
      passwordHash: await hashPassword(values.password),
      dateOfBirth: values.dateOfBirth,
      country: values.country,
      gender: values.gender,
    })
    .returning({ id: users.id, username: users.username, fullName: users.fullName });

  return Response.json(
    { message: `Welcome to Luvora, ${user.fullName}!`, user },
    { status: 201 },
  );
};

export const config: Config = {
  path: "/api/register",
  method: "POST",
};
