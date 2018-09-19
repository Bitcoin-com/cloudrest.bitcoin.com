"use strict"
const mongoose = require("mongoose")
const rp = require("request-promise")

const LOCALHOST = "http://localhost:5000"

function cleanDb() {
  for (const collection in mongoose.connection.collections) {
    if (mongoose.connection.collections.hasOwnProperty(collection))
      mongoose.connection.collections[collection].remove()
  }
}

function authUser(agent, callback) {
  agent
    .post("/users")
    .set("Accept", "application/json")
    .send({
      user: { username: "test", email: "test@example.com", password: "pass" }
    })
    .end((err, res) => {
      if (err) return callback(err)

      callback(null, {
        user: res.body.user,
        token: res.body.token
      })
    })
}

// This function is used to create new users.
// userObj = {
//   username,
//   email,
//   password
// }
async function createUser(userObj) {
  try {
    const options = {
      method: "POST",
      uri: `${LOCALHOST}/users`,
      resolveWithFullResponse: true,
      json: true,
      body: {
        user: {
          username: userObj.username,
          email: userObj.email,
          password: userObj.password
        }
      }
    }

    const result = await rp(options)

    const retObj = {
      user: result.body.user,
      token: result.body.token
    }

    return retObj
  } catch (err) {
    console.log(
      `Error in utils.js/createUser(): ${JSON.stringify(err, null, 2)}`
    )
    throw err
  }
}

module.exports = {
  cleanDb,
  authUser,
  createUser
}
