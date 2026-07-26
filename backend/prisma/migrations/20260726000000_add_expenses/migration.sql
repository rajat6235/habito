-- CreateTable
CREATE TABLE IF NOT EXISTS "expense_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7),
    "icon" VARCHAR(100),
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "title" VARCHAR(200),
    "expense_date" DATE NOT NULL,
    "note" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "expense_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "expense_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "quantity" DECIMAL(10,2),
    "unit" VARCHAR(50),
    "amount" DECIMAL(10,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expense_categories_user_id_idx" ON "expense_categories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "expense_categories_user_id_name_key" ON "expense_categories"("user_id", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expenses_user_id_expense_date_idx" ON "expenses"("user_id", "expense_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expenses_category_id_idx" ON "expenses"("category_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expense_items_expense_id_idx" ON "expense_items"("expense_id");

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------
-- SEED: DEFAULT GLOBAL EXPENSE CATEGORIES
-- -----------------------------------------------------------------------

INSERT INTO expense_categories (id, user_id, name, color, icon, is_global, sort_order) VALUES
  (gen_random_uuid(), NULL, 'Alcohol',        '#F59E0B', 'beer',         true, 1),
  (gen_random_uuid(), NULL, 'Supplements',    '#10B981', 'pill',         true, 2),
  (gen_random_uuid(), NULL, 'Junk Food',      '#EF4444', 'pizza',        true, 3),
  (gen_random_uuid(), NULL, 'Coffee',         '#78350F', 'coffee',       true, 4),
  (gen_random_uuid(), NULL, 'Shopping',       '#6366F1', 'shopping-bag', true, 5),
  (gen_random_uuid(), NULL, 'Miscellaneous',  '#6B7280', 'package',      true, 6)
ON CONFLICT DO NOTHING;
