import {
    Bson,
    MongoClient,
} from "https://deno.land/x/mongo@v0.31.2/mod.ts";

const client = new MongoClient();

// Connecting to a Local Database
await client.connect("mongodb://127.0.0.1:27017");

// Defining schema interface
interface DinosaurSchema {
    _id: ObjectId;
    name: string;
    description: string;
}

const db = client.database("test");
const dinosaurs = db.collection<DinosaurSchema>("dinosaurs");

const allDinosaurs = async () => {
    return dinosaurs.find({name: {$ne: null}}).toArray()
};

const oneDinosaur = async (args: any) => {
    return dinosaurs.findOne({name: args.name});
};

const addDinosaur = async (args: any) => {
    await dinosaurs.insertOne({
        name: args.name,
        description: args.description,
    })
    return dinosaurs.findOne({name: args.name});
};

export const resolvers = {
    Query: {
        allDinosaurs: () => allDinosaurs(),
        oneDinosaur: (_: any, args: any) => oneDinosaur(args),
    },
    Mutation: {
        addDinosaur: (_: any, args: any) => addDinosaur(args),
    },
};