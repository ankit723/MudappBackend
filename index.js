import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";

//creating and initialising the apps
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

//function for establishing connection with mongodb atlas
function establishMongooseConnection(dbName) {
  mongoose
    .connect(
      `mongodb+srv://varanasiartistomg:FHcOtwqlREAuttHS@cluster0.kr4sanb.mongodb.net/${dbName}?retryWrites=true&w=majority`,
      {}
    )
    .then(() => {
      console.log(`Connected to the mongodb of ${dbName}`);
    })
    .catch((error) => {
      console.log("Mongod connection error; ", error);
    });
}

const Users = new mongoose.model(
  "userCollection",
  new mongoose.Schema({}, { strict: false })
);
console.log("Connected to Users collection!");

const Contents = new mongoose.model(
  "contentCollection",
  new mongoose.Schema({}, { strict: false })
);
console.log("Connected to Content collection!");

app.post("/api/registerNewUser", async (req, res) => {
  const body = req.body;

  try {
    establishMongooseConnection("mdAdminBack");

    // Create a new user with the hashed password
    const user = new Users({ ...body });

    // Save the user to the database
    const userSaved = await user.save();

    res.status(200).json({ status: "userRegistered", user: userSaved });
    console.log("User saved");
  } catch (err) {
    console.error("Error during user registration:", err);
    res.status(404).json({ status: "notRegistered" });
  }
});

app.post("/api/loginUser", async (req, res) => {
  const { email, password } = req.body;
  try {
    establishMongooseConnection("mdAdminBack");
    const user = await Users.findOne({ email });
    if (!user) {
      console.log("does not exist");
      return res.status(401).json({ status: "userNotAuthenticated" });
    }

    let result = user.password === password;

    if (result) {
      console.log("User authenticated");
      return res.status(200).json({ status: "userAuthenticated", user });
    } else {
      console.log("User not authenticated");
      return res.status(401).json({ status: "userNotAuthenticated" });
    }
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

app.get("/api/getAllUser", async (req, res) => {
  try {
    establishMongooseConnection("mdAdminBack");
    const users = await Users.find({});
    console.log(users);
    return res.status(200).json({ status: "userAuthenticated", users });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

app.post("/api/removeUser", async (req, res) => {
  const { email } = req.body;
  try {
    establishMongooseConnection("mdAdminBack");
    const user = await Users.deleteOne({ email });
    return res.status(200).json({ status: "userAccessRevoked", user });
  } catch (err) {
    console.error("Error during deleting:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

app.post("/api/totalRegisteredUser", async (req, res) => {
  const { country } = req.body;
  if (country != undefined) {
    try {
      establishMongooseConnection("mdAdminBack");
      const users = await Users.find({ country });
      return res.status(200).json({ status: "userRecieved", users });
    } catch (err) {
      console.error("Error during getting users:", err);
      res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  }
  try {
    establishMongooseConnection("mdAdminBack");
    const users = await Users.find({});
    return res.status(200).json({ status: "userRecieved", users });
  } catch (err) {
    console.error("Error during getting users:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

app.get("/api/getRealTimeUsers", async (req, res) => {
  try {
    establishMongooseConnection("mdAdminBack");
    const users = await Users.find({ active: true });
    return res.status(200).json({ status: "userRecieved", users });
  } catch (err) {
    console.error("Error during getting current users:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

app.get("/api/getAvgScrnTimeBasedOnCountryLanguage", async (req, res) => {
  const { country, language } = req.body;
  try {
    establishMongooseConnection("mdAdminBack");
    const users = await Users.find({ country, language });
    let avgTime = 0;
    let count = 0;
    users.forEach((user) => {
      avgTime += user.scrnTime;
      count++;
    });
    avgTime = avgTime / count;
    return res.status(200).json({ status: "userRecieved", avgTime });
  } catch (err) {
    console.error("Error during getting average screen time:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

app.get("/api/getScreenTimeByUser", async (req, res) => {
  const { userId } = req.body;
  try {
    establishMongooseConnection("mdAdminBack");
    const user = await Users.findById(userId);
    return res
      .status(200)
      .json({ status: "userRecieved", screenTime: user.scrnTime });
  } catch (err) {
    console.error("Error during getting average screen time:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

app.post("/api/totalRegisteredContent", async (req, res) => {
  const { country } = req.body;
  if (country != undefined) {
    try {
      establishMongooseConnection("mdAdminBack");
      const contents = await Contents.find({ country });
      return res.status(200).json({ status: "userRecieved", contents });
    } catch (err) {
      console.error("Error during getting users:", err);
      res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  }
});

app.post("/api/contentWriterBasedOnCountry", async (req, res) => {
  const { country } = req.body;
  if (country != undefined) {
    try {
      establishMongooseConnection("mdAdminBack");
      const contents = await Contents.find({ country });
      const writers=contents.map((content)=>{
        return content.writer
      })
      return res.status(200).json({ status: "userRecieved", writer });
    } catch (err) {
      console.error("Error during getting users:", err);
      res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  }
});

app.post("/api/reportedContentBasedOnCategory", async (req, res) => {
  const { category } = req.body;
  if (category != undefined) {
    try {
      establishMongooseConnection("mdAdminBack");
      const contents = await Contents.find({ category, reported:true });
      return res.status(200).json({ status: "userRecieved", contents });
    } catch (err) {
      console.error("Error during getting users:", err);
      res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  }
});


app.post("/api/getAutoBlockedContents", async (req, res) => {
  try {
    establishMongooseConnection("mdAdminBack");
    const contents = await Contents.find({autoBlocked:true });
    return res.status(200).json({ status: "userRecieved", contents });
  } catch (err) {
    console.error("Error during getting users:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});


app.post("/api/blockContent", async (req, res) => {
  const { contentId } = req.body;
  try {
    establishMongooseConnection("mdAdminBack");
    const contents = await Contents.findByIdandUpdate(contentId, {block:true }, {new:true});
    return res.status(200).json({ status: "userRecieved", contents });
  } catch (err) {
    console.error("Error during getting users:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

app.post("/api/unBlockContent", async (req, res) => {
  const { contentId } = req.body;
  try {
    establishMongooseConnection("mdAdminBack");
    const contents = await Contents.findByIdandUpdate(contentId, {block:false }, {new:true});
    return res.status(200).json({ status: "userRecieved", contents });
  } catch (err) {
    console.error("Error during getting users:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

app.post("/api/updateShareCount", async (req, res) => {
  const { contentId } = req.body;
  try {
    establishMongooseConnection("mdAdminBack");
    const content = await Contents.findById(contentId);
    sharedTemp=content.shared
    const contents = await Contents.findByIdandUpdate(contentId, {shared:sharedTemp+1 }, {new:true});
    return res.status(200).json({ status: "userRecieved", contents });
  } catch (err) {
    console.error("Error during getting users:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});


app.post("/api/getSharedCount", async (req, res) => {
  const { contentId } = req.body;
  try {
    establishMongooseConnection("mdAdminBack");
    const content = await Contents.findById(contentId);
    return res.status(200).json({ status: "userRecieved", sharedTImes:content.shared });
  } catch (err) {
    console.error("Error during getting users:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});



app.listen(9000, () => {
  console.log("The app has started to listen at port 9000");
});
