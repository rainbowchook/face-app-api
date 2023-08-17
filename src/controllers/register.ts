import { Response } from 'express'
import { RequestWithBody } from '../server'
import { User, Login, Knex } from '../database'
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
      res.status(400).json('Unable to register')
    }
  }

// export const handleRegisterOld =
//   (pg: Knex) => (req: RequestWithBody, res: Response) => {
//     const { name, email, password } = req.body
//     if (name && email && password) {
//       bcrypt.hash(password, 10, (err, hash) => {
//         if (err) {
//           return res.status(400).json('Could not register: ' + err)
//         }
//         //Store hash password in DB
//         pg.transaction((trx) => {
//           return trx
//             .insert({ hash, email })
//             .into<Login, Pick<Login, 'email'>>('login')
//             .returning('email')
//             .then((loginEmail) => {
//               return (
//                 trx<User, Pick<User, keyof User>>('users')
//                   .returning('*')
//                   // .returning(['name', 'email', 'entries', 'joined'])
//                   .insert({
//                     name,
//                     email: loginEmail[0].email,
//                     joined: new Date(),
//                   })
//                 // .then((users) => {
//                 //   console.log('inside', users)
//                 //   return users
//                 //   // res.status(201).json(users[0])
//                 // })
//               )
//             })
//           // .then(trx.commit)
//           // .catch(trx.rollback)
//         })
//           .then((users) => {
//             console.log('here', users)
//             res.status(201).json(users[0])
//           })
//           .catch((error) => res.status(400).json(error))
//       })
//     } else {
//       res.status(400).json('Unable to register')
//     }
//   }
