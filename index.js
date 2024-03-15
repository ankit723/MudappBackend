import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import admin from 'firebase-admin'
import serviceAccount from './xfantasy-d0d9f-firebase-adminsdk-8rpof-c0a3e81b02.json' with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const accessAllCollectionItem = (collectionName) => {
  return new Promise((resolve, reject) => {
    const docRef = db.collection(collectionName);
    const data = [];
    docRef.get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          data.push(doc.data());
        });
        resolve(data); // Resolve the promise with the data
      })
      .catch((error) => {
        console.error('Error getting documents:', error);
        reject(error); // Reject the promise with the error
      });
  });
}

const accessItemWithQuery = (collectionName, key, comparison, value) => {
  return new Promise((resolve, reject) => {
    const docRef = db.collection(collectionName);
    const data = [];
    docRef.where(key, comparison, value).get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          data.push(doc.data());
        });
        resolve(data); // Resolve the promise with the data
      })
      .catch((error) => {
        console.error('Error getting documents:', error);
        reject(error); // Reject the promise with the error
      });
  });
}


// accessAllCollectionItem("AllUserPosts").then((data)=>console.log(data))




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
      // establishMongooseConnection("mdAdminBack");
      // const users = await Users.find({ country });
      const users = await accessItemWithQuery("UserData", 'country', '==', country);
      return res.status(200).json({ status: "userRecieved", users });
    } catch (err) {
      console.error("Error during getting users:", err);
      res
        .status(500)
        .json({ status: "error", message: "Internal Server Error" });
    }
  }
  try {
    // establishMongooseConnection("mdAdminBack");
    const users = await accessAllCollectionItem("UserData");
    return res.status(200).json({ status: "userRecieved", users });
  } catch (err) {
    console.error("Error during getting users:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});


app.post("/api/getRealTimeUsers", async (req, res) => {
  try {
    establishMongooseConnection("mdAdminBack");
    // const users = await Users.find({ active: true });
    const users = await accessItemWithQuery("UserData", 'active', '==', 'true');
    return res.status(200).json({ status: "userRecieved", users });
  } catch (err) {
    console.error("Error during getting current users:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});


app.post("/api/getAvgScrnTimeBasedOnCountry", async (req, res) => {
  const { country, language } = req.body;
  try {
    establishMongooseConnection("mdAdminBack");
    // const users = await Users.find({ country, language });
    const users = await accessItemWithQuery("UserData", 'country', '==', country);
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



app.post("/api/allPosts", async (req, res) => {
  const { country } = req.body;
  if (country != undefined) {
    try {
      establishMongooseConnection("mdAdminBack");
      const contents = await accessAllCollectionItem("AllUserPosts");
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
      // const contents = await Contents.find({ country });
      const contents = await accessItemWithQuery("AllUserPosts", "country", "==", country);
      const writers=contents.map((content)=>{
        return content.userId
      })
      const users=writers.map((writer)=>{
        return accessItemWithQuery("UserData", "id", "==", writer)
      })
      return res.status(200).json({ status: "userRecieved", users });
    } catch (err) {
      console.error("Error during getting users:", err);
      res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  }
});



app.post("/api/getBlockedContents", async (req, res) => {
  try {
    establishMongooseConnection("mdAdminBack");
    const contents = await accessItemWithQuery("AllUserPosts", 'block', '==',  true);
    return res.status(200).json({ status: "userRecieved", contents });
  } catch (err) {
    console.error("Error during getting users:", err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});


app.post("/api/blockContent", async (req, res) => {
  const { contentId } = req.body;
  try {
    // Assuming "contents" is your Firestore collection name
    const contentRef = db.collection('AllUserPosts').doc(contentId);
    
    // Update the document
    await contentRef.update({ block: true });

    // Optionally, get the updated document
    const updatedContent = await contentRef.get();
    const data = updatedContent.data();

    return res.status(200).json({ status: "userReceived", content: data });
  } catch (err) {
    console.error("Error during blocking content:", err);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

app.post("/api/unBlockContent", async (req, res) => {
  const { contentId } = req.body;
  try {
    // Assuming "contents" is your Firestore collection name
    const contentRef = db.collection('AllUserPosts').doc(contentId);
    
    // Update the document
    await contentRef.update({ block: false });

    // Optionally, get the updated document
    const updatedContent = await contentRef.get();
    const data = updatedContent.data();

    return res.status(200).json({ status: "userReceived", content: data });
  } catch (err) {
    console.error("Error during blocking content:", err);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

app.post("/api/updateShareCount", async (req, res) => {
  const { contentId } = req.body;
  try {
    // Assuming "contents" is your Firestore collection name
    const contentRef = db.collection('AllUserPosts').doc(contentId);
    
    // Get the current document data
    const contentSnapshot = await contentRef.get();
    const contentData = contentSnapshot.data();
    
    // Increment the share count
    const newShareCount = (contentData.shared || 0) + 1;

    // Update the document with the new share count
    await contentRef.update({ shared: newShareCount });

    // Optionally, fetch the updated document data
    const updatedContentSnapshot = await contentRef.get();
    const updatedContentData = updatedContentSnapshot.data();

    return res.status(200).json({ status: "userReceived", content: updatedContentData });
  } catch (err) {
    console.error("Error during updating share count:", err);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

app.post("/api/getSharedCount", async (req, res) => {
  const { contentId } = req.body;
  try {
    // Assuming "contents" is your Firestore collection name
    const contentRef = db.collection('AllUserPosts').doc(contentId);
    
    // Get the document data
    const contentSnapshot = await contentRef.get();
    const contentData = contentSnapshot.data();
    
    // Extract the shared count
    const sharedTimes = contentData.shared || 0;

    return res.status(200).json({ status: "userReceived", sharedTimes });
  } catch (err) {
    console.error("Error during getting shared count:", err);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});



app.listen(9000, () => {
  console.log("The app has started to listen at port 9000");
});
