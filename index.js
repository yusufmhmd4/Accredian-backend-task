const express = require("express");
const app = express();

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const {v4} =require("uuid")

const databasePath = path.join(__dirname, "users.sql");
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();


app.post('/register', async (request, response) => {
    const { username, email, password } = request.body;
    const id=v4();
  
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `SELECT * FROM users WHERE username = '${username}' OR email = '${email}';`;
    const databaseUser = await database.get(selectUserQuery);
  
    if (!databaseUser) {
      const createUserQuery = `
        INSERT INTO users (id,username, email, password)
        VALUES ('${id}','${username}', '${email}', '${hashedPassword}');
      `;
      await database.run(createUserQuery);
      response.status(200)
      response.send('User created successfully');
    } else {
      response.status(400)
      response.send('Username or Email already exists');
    }
  });
  
  app.post("/login", async (request, response) => {
    const { usernameOrEmail, password } = request.body;

    try {
      const selectUserQuery = `
        SELECT * FROM users
        WHERE username = ? OR email = ?;
      `;
      const databaseUser = await database.get(selectUserQuery, [usernameOrEmail, usernameOrEmail]);
      if (!databaseUser) {
        response.status(400)
        response.send("Invalid User");
      } else {
        const isPasswordMatched = await bcrypt.compare(password, databaseUser.password);
        if (isPasswordMatched) {
          response.status(200)
          response.send({username:databaseUser.username});
        } else {
          response.status(400)
          response.send("Invalid password");
        }
      }
    } catch (error) {
      response.status(500)
      response.send('Internal server error');
    }
  });
 