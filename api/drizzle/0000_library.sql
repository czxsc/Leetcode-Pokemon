CREATE TABLE "custom_tags" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "custom_tags_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "libraries" (
	"user_id" text PRIMARY KEY NOT NULL,
	"rev" integer NOT NULL,
	"saved_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_tags" (
	"user_id" text NOT NULL,
	"problem_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "problem_tags_user_id_problem_id_tag_id_pk" PRIMARY KEY("user_id","problem_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"difficulty" text NOT NULL,
	"language" text NOT NULL,
	"code" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"solved_on" date,
	"claimed" boolean NOT NULL,
	"claimed_on" date,
	CONSTRAINT "problems_user_id_id_pk" PRIMARY KEY("user_id","id"),
	CONSTRAINT "problems_difficulty" CHECK ("problems"."difficulty" in ('Easy', 'Medium', 'Hard'))
);
--> statement-breakpoint
ALTER TABLE "custom_tags" ADD CONSTRAINT "custom_tags_user_id_libraries_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."libraries"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_tags" ADD CONSTRAINT "problem_tags_user_id_problem_id_problems_user_id_id_fk" FOREIGN KEY ("user_id","problem_id") REFERENCES "public"."problems"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_user_id_libraries_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."libraries"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "problem_tags_tag" ON "problem_tags" USING btree ("user_id","tag_id");--> statement-breakpoint
CREATE INDEX "problems_solved_on" ON "problems" USING btree ("user_id","solved_on");