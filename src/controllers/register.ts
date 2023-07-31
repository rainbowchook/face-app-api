import { Response } from "express"
import { RequestWithBody } from "../server"
import { User, Login, Knex } from '../database'
import bcrypt from 'bcryptjs'

export const handleRegister = (pg: Knex) => (req: RequestWithBody, res: Response) => {
  const { name, email, password } = req.body
  // const { users, logins } = database
  if (name && email && password) {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        res.status(400).json('Could not register: ' + err)
      }
      //Store hash password in DB
      pg.transaction((trx) => {
        trx
          .insert({ hash, email })
          .into<Login, Pick<Login, 'email'>>('login')
          .returning('email')
          .then((loginEmail) => {
            return (
              trx<User, Pick<User, keyof User>>('users')
                .returning('*')
                // .returning(['name', 'email', 'entries', 'joined'])
                .insert({
                  name,
                  email: loginEmail[0].email,
                  joined: new Date(),
                })
                .then((users) => {
                  // console.log(users)
                  res.status(201).json(users[0])
                })
            )
          })
          .then(trx.commit)
          .catch(trx.rollback)
      }).catch((error) => res.status(400).json(error))
    })
  } else {
    res.status(400).json('Unable to register')
  }
}