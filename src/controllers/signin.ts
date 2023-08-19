import { Response } from 'express'
import { RequestWithBody } from '../server'
import bcrypt from 'bcryptjs'
import { getLoginByEmail, getUserByEmail } from '../services/queries'

export const handleSignin = () => (req: RequestWithBody, res: Response) => {
  const { email, password } = req.body
  if (email && password) {
    getLoginByEmail(email)
      .then((user) => {
        if (user.length && user[0]) {
          bcrypt.compare(password, user[0].hash, (err, success) => {
            if (success) {
              getUserByEmail(user[0].email)
                .then((userData) => {
                  userData.length && userData[0]
                    ? res.json(userData[0])
                    : res
                        .status(500)
                        .json(
                          `User email ${email} does not exist for this login`
                        )
                })
                .catch((error) => {
                  console.error('Error:', error)
                  throw new Error('Error signing in:' + error)
                })
            } else {
              console.error(err)
              res.status(400).json('Invalid credentials:' + err)
            }
          })
        } else {
          res.status(400).json('Incorrect email or password')
        }
      })
      .catch((error) => res.status(400).json(error))
  } else {
    res.status(400).json('Error: Please enter Email and Password')
  }
}
