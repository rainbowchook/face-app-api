import { Response } from 'express'
import { RequestWithBody } from '../server'
import bcrypt from 'bcryptjs'
import { createUserAndLogin } from '../services/queries'

export const handleRegister =
  () => (req: RequestWithBody, res: Response) => {
    const { name, email, password } = req.body
    if (name && email && password) {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return res.status(400).json('Could not register: ' + err)
        }
        //Store hash password in DB
        createUserAndLogin(hash, name, email)
          .then((users) => res.status(201).json(users[0]))
          .catch((error) => res.status(400).json(error))
      })
    } else {
      res.status(400).json('Error: Please enter Name, Email and Password')
    }
  }
