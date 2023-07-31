import { Response } from "express"
import { RequestWithBody } from "../server"
import { Login, Knex } from '../database'
import bcrypt from 'bcryptjs'

export const handleSignin = (pg: Knex) => (req: RequestWithBody, res: Response) => {
  const { email, password } = req.body
  if (email && password) {
    pg<Login>('login')
      .where({ email })
      .then((user) => {
        console.log(user)
        if (user[0]) {
          bcrypt.compare(password, user[0].hash, (err, success) => {
            if (success) {
              const returnUser: Partial<Login> = {...user[0]}
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