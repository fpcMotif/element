import { defineApp } from "convex/server";
import schema from "./schema";
import * as actions from "./actions";
import * as mutations from "./mutations";
import * as queries from "./queries";

const app = defineApp();

app.use(schema);

app.query("messages:list", queries.listMessages);
app.query("messages:get", queries.getMessage);
app.query("profiles:get", queries.getProfile);

app.mutation("messages:create", mutations.createMessage);
app.mutation("profiles:save", mutations.saveProfileSummary);

app.action("messages:broadcast", actions.broadcastMessage);

export default app;
