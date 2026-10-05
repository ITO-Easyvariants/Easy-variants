import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const { connectToDatabase } = await import('../api/_lib/mongodb.js');
  const Content = (await import('../api/_lib/Content.js')).default;
  const { decodeBlocks } = await import('../api/_lib/blockKeyUtils.js');

  await connectToDatabase();
  const doc = await Content.findOne({ page: 'home' });
  if (!doc) {
    console.error("No document");
    process.exit(1);
  }
  const blocks = decodeBlocks(doc.blocks);
  const draftBlocks = decodeBlocks(doc.draftBlocks);
  console.log("PUBLISHED:");
  console.log(JSON.stringify(blocks['meet.video'], null, 2));
  console.log("DRAFT:");
  console.log(JSON.stringify(draftBlocks['meet.video'], null, 2));
  process.exit(0);
}
run().catch(console.error);
