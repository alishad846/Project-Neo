CREATE TABLE "sellers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(150),
	"shop_name" varchar(150),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sellers_email_unique" UNIQUE("email")
);
