import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

const typeDefs = `
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hello GraphQL!",
  },
};

async function start() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start()

  app.use("/graphql", cors(), bodyParser.json(), expressMiddleware(server));

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.listen(port, () => {
    console.log(`Example app listening at ${port}`);
  });
}

start();