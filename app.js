const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
const bcrypt = require('bcrypt')
app.use(express.json())

const dbpath = path.join(__dirname, 'userData.db')
let db = null

const initializeServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started at local host:3000')
    })
  } catch (e) {
    console.log(`Unable to start server:${e.message}`)
    process.exit(1)
  }
}
initializeServer()
app.post('/register/', async (request, response) => {
  let {username, name, password, gender, location} = request.body
  const checkUser = `SELECT * FROM user where username='${username}';`
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const dbUser = await db.get(checkUser)
  if (dbUser === undefined) {
    if (password.length > 4) {
      const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`
      const newUser = await db.run(createUserQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})
app.post('/login/', async (request, response) => {
  let {username, password} = request.body
  const checkuser = `SELECT * FROM user where username='${username}';`
  const user = await db.get(checkuser)
  if (user === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(password, user.password)
    if (isPasswordMatch == true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})
app.put('/change-password/', async (request, response) => {
  let {username, oldPassword, newPassword} = request.body
  const checkuser = `SELECT * FROM user where username='${username}';`
  const user = await db.get(checkuser)
  const isPasswordMatch = await bcrypt.compare(oldPassword, user.password)
  if (isPasswordMatch === true) {
    if (newPassword.length > 4) {
      const newHassPass = await bcrypt.hash(request.body.newPassword, 10)
      const updateQuery = `UPDATE user SET username='${username}',name='${user.name}',password='${newHassPass}',gender='${user.gender}',location='${user.location}';`
      await db.run(updateQuery)
      response.send('Password updated')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

module.exports = app
