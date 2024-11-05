import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import mongodb from "mongodb";

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

var MongoClient = mongodb.MongoClient;
var url = "mongodb+srv://vz:vz123@cluster0.yrrsk.mongodb.net/VIZIONSYS?retryWrites=true&w=majority";
const databasename = "VIZIONSYS";
app.use(express.static("public"));

// Use MongoDB Atlas connection instead of local MongoDB
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MongoDB connected to Atlas");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });

const formdataSchema = new mongoose.Schema({
    BranchName: { type: String, required: true },
    Dependency: { type: String, required: true },
    ChangeLog: { type: String, required: true },
    TicketID: { type: String, required: true },
    DeveloperName: { type: String, required: true },
});

const updatedschema = new mongoose.Schema({
    BranchName: { type: String, required: true },
    Dependency: { type: String, required: true },
    ChangeLog: { type: String, required: true },
    TicketID: { type: String, required: true },
    DeveloperName: { type: String, required: true },
    IsApproved: { type: Boolean, required: true },
    IsPublished: { type: Boolean, required: true },
});

const FormData = mongoose.model("FormData", formdataSchema);
const Updatedmodel = mongoose.model("updatedform", updatedschema);

app.get("/", (req, res) => {
    res.redirect("/display");
    res.render("open", { users: [] });
});

app.post("/approved", async (req, res) => {
    const selectedUsers = req.body.selectedUsers;
    const action = req.body.action;

    if (!selectedUsers || selectedUsers.length === 0) {
        console.log("No users selected.");
        return res.send("No users selected.");
    }

    console.log("Selected User IDs:", selectedUsers);
    console.log("Action:", action);

    try {
        let update = {};
        if (action === "approve") {
            update = { IsApproved: true };
        } else if (action === "publish") {
            update = { IsPublished: true };
        }

        await Updatedmodel.updateMany(
            { _id: { $in: selectedUsers } },
            { $set: update }
        );

        console.log("Users updated successfully.");
        res.redirect("/display");
    } catch (error) {
        console.error("Error updating users:", error);
        res.status(500).send("Error processing users.");
    }
});

app.get("/display", (req, res) => {
    MongoClient.connect(url)
        .then((client) => {
            const connect = client.db(databasename);
            const collection = connect.collection("updatedforms");

            collection.find({}).toArray()
                .then((ans) => {
                    res.render("open", { users: ans });
                })
                .catch((error) => {
                    console.error("Error fetching data:", error);
                    res.status(500).send("Error fetching data");
                });
        })
        .catch((error) => {
            console.error("Database connection error:", error);
            res.status(500).send("Database connection error");
        });
});

app.post("/datatransfer", (req, res) => {
    const { branchname, "Ticket ID": ticket_id, "Change log": change_log, Dependency: dependency, "Developer name": developer_name } = req.body;

    const newFormData = new FormData({
        BranchName: branchname,
        TicketID: ticket_id,
        ChangeLog: change_log,
        Dependency: dependency,
        DeveloperName: developer_name,
    });

    const updatedformdata = new Updatedmodel({
        BranchName: branchname,
        TicketID: ticket_id,
        ChangeLog: change_log,
        Dependency: dependency,
        DeveloperName: developer_name,
        IsApproved: false,
        IsPublished: false,
    });

    newFormData.save()
        .then(() => {
            console.log("Data saved successfully");
        })
        .catch((error) => {
            console.error("Error saving data:", error);
            res.status(500).send("Error saving data");
        });

    updatedformdata.save()
        .then(() => {
            console.log("Data saved successfully in updated form");
            res.redirect("/display");
        })
        .catch((error) => {
            console.error("Error saving data:", error);
            res.status(500).send("Error saving data");
        });
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});