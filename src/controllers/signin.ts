import { Response } from 'express'
import { RequestWithBody } from '../server'
import { User, Login, Knex } from '../database'
import bcrypt from 'bcryptjs'

const getUserDataByEmail = (pg: Knex, email: string) => {
  try {
    const userData = pg<User>('users').where('users.email', '=', email)
    return userData
  } catch (error) {
    console.error('Error retrieving user data:', error)
    throw error
  }
}

const getUserAndLoginDataByEmail = (pg: Knex, email: string) => {
  try {
    const userData = pg
      .select()
      .from<User>('users')
      .join('login', 'users.id', '=', 'login.id')
      .where('login.email', '=', email)
    return userData
  } catch (error) {
    console.error('Error retrieving user data:', error)
    throw error
  }
}

export const handleSignin =
  (pg: Knex) => (req: RequestWithBody, res: Response) => {
    const { email, password } = req.body
    if (email && password) {
      pg<Login>('login')
        .where({ email })
        .then((user) => {
          console.log(user)
          if (user[0]) {
            bcrypt.compare(password, user[0].hash, (err, success) => {
              if (success) {
                console.log('password correct', user[0])
                getUserDataByEmail(pg, user[0].email)
                  .then((userData) => {
                    console.log('User Data:', userData)
                    const returnUser: Partial<User> = { ...userData[0] }
                    // delete returnUser.hash
                    res.json(returnUser)
                  })
                  .catch((error) => {
                    console.error('Error:', error)
                    res.status(400).json('Error signing in')
                  })
              } else {
                console.log(err)
                res.status(400).json('Invalid credentials')
              }
            })
          } else {
            res.status(400).json('Incorrect email or password')
          }
        })
        .catch((err) => {
          console.log(err)
          res.status(400).json('Invalid email or password')
        })
    } else {
      res.status(400).json('error logging in')
    }
  }

export const handleSigninOld =
  (pg: Knex) => (req: RequestWithBody, res: Response) => {
    const { email, password } = req.body
    if (email && password) {
      pg<Login>('login')
        .where({ email })
        .then((user) => {
          console.log(user)
          if (user[0]) {
            bcrypt.compare(password, user[0].hash, (err, success) => {
              if (success) {
                const returnUser: Partial<Login> = { ...user[0] }
                delete returnUser.hash
                res.json(returnUser)
              } else {
                console.log(err)
                res.status(400).json('Invalid credentials')
              }
            })
          } else {
            res.status(400).json('Incorrect email or password')
          }
        })
        .catch((err) => {
          console.log(err)
          res.status(400).json('Invalid email or password')
        })
    } else {
      res.status(400).json('error logging in')
    }
  }
