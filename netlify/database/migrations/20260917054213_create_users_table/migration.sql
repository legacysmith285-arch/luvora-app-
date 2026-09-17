CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"full_name" text NOT NULL,
	"username" text NOT NULL UNIQUE,
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"country" text NOT NULL,
	"gender" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
