import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Define the table schema
export const names = sqliteTable('names', {
  name: text('name').notNull(), // Define the `name` column
});
