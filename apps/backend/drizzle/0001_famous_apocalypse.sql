CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"adapter_id" varchar(50) DEFAULT 'internal' NOT NULL,
	"kind" varchar(50) NOT NULL,
	"snapshot" jsonb NOT NULL,
	"diff" jsonb,
	"result" varchar(20) DEFAULT 'success' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
