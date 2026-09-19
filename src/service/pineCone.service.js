const { Pinecone } = require("@pinecone-database/pinecone");

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const index = pc.index(process.env.PINECONE_INDEX_NAME);

async function upsertToPineCone({ vectors, msg_id, metadata }) {
  const record = {
    id: msg_id.toString(),
    values: vectors,
    metadata: {
      chatId: metadata.chatId,
      userId: metadata.userId.toString(),
      text: metadata.text,
    },
  };

  try {
    const response = await index.upsert({
      records: [record],
    });

    console.log("upsert success");
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function queryPineCone({ queryVector, userId,limit = 5 }) {
  try {
    const response = await index.query({
      vector: queryVector,
      topK: limit,
      includeMetadata: true,
      filter: {
        userId: userId.toString(),
      },
    });
    console.log("PineCone query response:", response);
    return response;
  }catch (error) {
  console.error("Error querying PineCone:", error.message);
  throw error;
}
}

module.exports = { upsertToPineCone, queryPineCone };
