// @ts-check
"use strict";

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}
const { MongoClient } = require("mongodb");

const SOURCE_URL = "mongodb+srv://adepojuololade2020:j0k2iy9xXcraCpHn@succomongo.b5r4o.mongodb.net/healthclique?retryWrites=true&w=majority&appName=succomongo";
const TARGET_URL = "mongodb+srv://adepojuololade2003_db_user:8IcoXagdfkzZurbm@cluster0.gkq7rkk.mongodb.net/kkes?retryWrites=true&w=majority&appName=ileritech";

async function main() {
  console.log("Connecting to Source DB (healthclique)...");
  const sourceClient = new MongoClient(SOURCE_URL);
  await sourceClient.connect();
  const sourceDb = sourceClient.db();

  console.log("Connecting to Target DB (kkes)...");
  const targetClient = new MongoClient(TARGET_URL);
  await targetClient.connect();
  const targetDb = targetClient.db();

  console.log(`Source DB name: ${sourceDb.databaseName}`);
  console.log(`Target DB name: ${targetDb.databaseName}`);

  const collections = await sourceDb.listCollections().toArray();
  console.log(`Found ${collections.length} collections in source DB.`);

  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith("system.")) continue;

    console.log(`\nProcessing collection: ${colName}`);
    const sourceCol = sourceDb.collection(colName);
    const targetCol = targetDb.collection(colName);

    const docs = await sourceCol.find({}).toArray();
    console.log(`  Read ${docs.length} documents from source.`);

    if (docs.length > 0) {
      // Clear target collection first to ensure exact replica
      await targetCol.deleteMany({});
      console.log(`  Cleared target collection '${colName}'.`);

      // Insert all documents preserving _id and all fields/types
      const result = await targetCol.insertMany(docs);
      console.log(`  Inserted ${result.insertedCount} documents into target collection '${colName}'.`);
    } else {
      console.log(`  Skipping insert for empty collection '${colName}'.`);
    }
  }

  console.log("\nMigration completed successfully!");

  await sourceClient.close();
  await targetClient.close();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
