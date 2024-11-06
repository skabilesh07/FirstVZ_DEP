import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const mongoURL = "mongodb+srv://vz:vz123@cluster0.yrrsk.mongodb.net/VIZIONSYS?retryWrites=true&w=majority";
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected to Atlas"))
    .catch((error) => console.error("MongoDB connection error:", error));

const formdataSchema = new mongoose.Schema({
    BranchName: String,
    Dependency: String,
    ChangeLog: String,
    TicketID: String,
    DeveloperName: String
});

const updatedSchema = new mongoose.Schema({
    BranchName: String,
    Dependency: String,
    ChangeLog: String,
    TicketID: String,
    DeveloperName: String,
    PRID:String,
    IsApproved: { type: Boolean, default: false },
    IsPublished: { type: Boolean, default: false },
    VersionNumber: { type: String, default: "" },
    ApprovedDate: { type: Date, default: null },
    PublishedDate: { type: Date, default: null }
});

const FormData = mongoose.model("FormData", formdataSchema);
const UpdatedModel = mongoose.model("UpdatedForm", updatedSchema);

app.use(express.static("public"));

app.get("/", (req, res) => res.redirect("/display"));

app.post("/approved", async (req, res) => {
    const { selectedUsers, action } = req.body;
    const versionNo = req.body["version num"];
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    console.log(formattedDate);

    if (!selectedUsers) {
        console.log("No users selected.");
        return res.send("No users selected.");
    }

    try {
        let update = {};
        if (action === "approve") {
            update = { IsApproved: true, VersionNumber: versionNo, ApprovedDate: formattedDate };
        } else if (action === "publish") {
            update = { IsPublished: true, VersionNumber: versionNo, PublishedDate: formattedDate };
        }

        const result = await UpdatedModel.updateMany(
            { _id: { $in: selectedUsers } },
            { $set: update }
        );

        console.log(`${result.modifiedCount} documents updated successfully.`);
        res.redirect("/display");
    } catch (error) {
        console.error("Error updating users:", error);
        res.status(500).send("Error processing users.");
    }
});

app.get("/display", async (req, res) => {
    try {
        const users = await UpdatedModel.find({});
        res.render("open", { users });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
});

app.post("/datatransfer", async (req, res) => {
    const { branchname, Dependency, "Change log": changeLog, "Ticket ID": ticketID, "Developer name": developerName } = req.body;
    const req_prid=req.body["prid"];
    console.log(req_prid);
    const newFormData = new FormData({ BranchName: branchname, Dependency, ChangeLog: changeLog, TicketID: ticketID, DeveloperName: developerName });
    const updatedFormData = new UpdatedModel({ BranchName: branchname, Dependency, ChangeLog: changeLog, TicketID: ticketID, DeveloperName: developerName,PRID:req_prid });

    try {
        await newFormData.save();
        await updatedFormData.save();
        console.log("Data saved successfully in both collections.");
        res.redirect("/display");
    } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).send("Error saving data");
    }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));