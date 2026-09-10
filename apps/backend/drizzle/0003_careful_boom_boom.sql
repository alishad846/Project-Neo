ALTER TABLE "product_genome" ALTER COLUMN "seller_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "product_genome_history" ALTER COLUMN "seller_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "seller_id" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "product_genome" ADD CONSTRAINT "product_genome_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_genome_history" ADD CONSTRAINT "product_genome_history_product_id_product_genome_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product_genome"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_genome_history" ADD CONSTRAINT "product_genome_history_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_genome_seller_id_idx" ON "product_genome" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "product_genome_history_product_version_idx" ON "product_genome_history" USING btree ("product_id","version");--> statement-breakpoint
CREATE INDEX "transactions_seller_id_idx" ON "transactions" USING btree ("seller_id");--> statement-breakpoint
ALTER TABLE "product_genome" ADD CONSTRAINT "product_genome_seller_sku_unique" UNIQUE("seller_id","sku");--> statement-breakpoint
ALTER TABLE "product_genome" ADD CONSTRAINT "product_genome_version_check" CHECK ("product_genome"."version" >= 1);--> statement-breakpoint
ALTER TABLE "product_genome" ADD CONSTRAINT "product_genome_weight_check" CHECK ("product_genome"."weight" IS NULL OR "product_genome"."weight" >= 0);--> statement-breakpoint
ALTER TABLE "product_genome" ADD CONSTRAINT "product_genome_cost_price_check" CHECK ("product_genome"."cost_price" IS NULL OR "product_genome"."cost_price" >= 0);--> statement-breakpoint
ALTER TABLE "product_genome" ADD CONSTRAINT "product_genome_selling_price_check" CHECK ("product_genome"."selling_price" IS NULL OR "product_genome"."selling_price" >= 0);--> statement-breakpoint
ALTER TABLE "product_genome_history" ADD CONSTRAINT "product_genome_history_version_check" CHECK ("product_genome_history"."version" >= 1);--> statement-breakpoint
ALTER TABLE "product_genome_history" ADD CONSTRAINT "product_genome_history_weight_check" CHECK ("product_genome_history"."weight" IS NULL OR "product_genome_history"."weight" >= 0);--> statement-breakpoint
ALTER TABLE "product_genome_history" ADD CONSTRAINT "product_genome_history_cost_price_check" CHECK ("product_genome_history"."cost_price" IS NULL OR "product_genome_history"."cost_price" >= 0);--> statement-breakpoint
ALTER TABLE "product_genome_history" ADD CONSTRAINT "product_genome_history_selling_price_check" CHECK ("product_genome_history"."selling_price" IS NULL OR "product_genome_history"."selling_price" >= 0);