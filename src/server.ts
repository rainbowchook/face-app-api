import express, { Request, Response } from 'express'
import cors from 'cors'
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { database, User, Login } from './database'
import knex from 'knex'

const config = {
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT),
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_SSL: process.env.DB_SSL,
}

const pg = knex({
  client: 'pg',
  connection: {
    connectionString: config.DATABASE_URL,
    host: config['DB_HOST'],
    port: config['DB_PORT'],
    user: config['DB_USER'],
    database: config['DB_NAME'],
    password: config['DB_PASSWORD'],
    // ssl: config["DB_SSL"] ? { rejectUnauthorized: false } : false,
  },
})

// const usersQueryBuilder = pg.select('*').from('login')
// pg<User>('users').select('*')
// .then(data => console.log(data))
// if (true) {
//   // This select will not change the type of usersQueryBuilder
//   // We can not change the type of a pre-declared variable in TypeScript
//   usersQueryBuilder.select('email');
// }
// console.log(usersQueryBuilder)
// usersQueryBuilder
//   .then((login) => {
// Type of users here will be Pick<User, "id">[]
// which may not be what you expect.
//   console.log(login)
// })
// .catch((err) => console.log(err))

// You can specify the type of result explicitly through a second type parameter:
// const queryBuilder = pg<User, Pick<User, 'id' | 'email'>>('users')

// But there is no type constraint to ensure that these properties have actually been
// selected.

// So, this will compile:
// queryBuilder.select('name').then((users) => {
// Type of users is Pick<User, "id"> but it will only have name
// })

interface RequestWithBody extends Request {
  body: { [key: string]: string | undefined }
}

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.options('*', cors())

const corsOptions: cors.CorsOptions = {
  origin: true,
  optionsSuccessStatus: 200,
}

app.get('/', cors(corsOptions), (req: Request, res: Response) => {
  pg('users')
    .select('*')
    .then((users) => {
      console.log(users)
      res.json(users)
    })
  // const { users } = database
  // res.json(users)
  // res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`)
})
app.post(
  '/signin',
  cors(corsOptions),
  (req: RequestWithBody, res: Response) => {
    const { email, password } = req.body
    const { users, logins } = database
    if (email && password) {
      // const user: User | undefined = users.find(
      //   (user) => user.email === email
      // )
      pg<Login>('login')
        .where({ email })
        .then((user) => {
          console.log(user)
          if (user[0]) {
            bcrypt.compare(password, user[0].hash, (err, success) => {
              if (success) {
                res.json(user)
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
      // if (user) {
      //   bcrypt.compare(password, user.password, (err, success) => {
      //     if(success) {
      //       res.json(user)
      //     } else {
      //       console.log(err)
      //       res.status(400).json('Invalid credentials')
      //     }
      //   })
      // } else {
      //   res.json('Incorrect email or password')
      // }
    } else {
      res.status(400).json('error logging in')
    }
    // res.json('signin is working')
  }
)

// app.post(
//   '/signin',
//   cors(corsOptions),
//   (req: RequestWithBody, res: Response) => {
//     const { email, password } = req.body
//     const { logins } = database
//     if (email && password) {
//       const user: Login | undefined = logins.find(
//         (user) => user.email === email && user.hash === password
//       )
//       if (user) {
//         res.json(user)
//       } else {
//         res.json('Incorrect email or password')
//       }
//     } else {
//       res.status(400).json('error logging in')
//     }
//     // res.json('signin is working')
//   }
// )

app.post(
  '/register',
  cors(corsOptions),
  (req: RequestWithBody, res: Response) => {
    const { name, email, password } = req.body
    // const { users, logins } = database
    if (name && email && password) {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          res.status(400).json('Could not register: ' + err)
        }
        // try {
        //Store hash password in DB
        console.log(hash)
        pg<User, Pick<User, keyof User>>('users')
          .returning('*')
          // .returning(['name', 'email', 'entries', 'joined'])
          .insert({
            name,
            email,
            joined: new Date(),
          })
          .then((users) => {
            console.log(users)
            res.status(201).json(users[0])
          })
          .catch((error) => {
            console.log(error)
            res.status(400).json(error)
          })
        // const id = String(Number(users[users.length - 1].id) + 1)
        // const newUser: User = {
        //   id,
        //   name,
        //   email,
        //   entries: 0,
        //   joined: new Date(),
        // }
        // const newLogin: Login = {
        //   id,
        //   email,
        //   hash
        // }
        // users.push(newUser)
        // logins.push(newLogin)
        // const returnedUser = { ...newUser } as Partial<User>
        // delete returnedUser.id
        // res.status(201).json(returnedUser)
        //or return the last item in the array: res.json(users[users.length - 1])
        // } catch (err) {
        //   res.status(400).json('Could not register: ' + err)
        // }
      })
    } else {
      res.status(400).json('Invalid credentials')
    }
  }
)

app.get('/profile/:id', cors(corsOptions), (req: Request, res: Response) => {
  const { id } = req.params
  // const { users } = database
  pg<User>('users')
    .select('*')
    .where({ id })
    .then((user) => {
      console.log(user)
      if (user && user.length) {
        res.json(user[0])
      } else {
        res.status(400).json('Not found')
      }
    })
    .catch((err) => res.status(500).json('Unable to find user ' + err))
  // const user: User | undefined = users.find((user) => user.id === id)
  // if (user) {
  //   res.json(user)
  // } else {
  //   res.status(404).json('user not found')
  // }
})

app.put('/image', cors(corsOptions), (req: RequestWithBody, res: Response) => {
  const { id } = req.body
  // pg<User, Pick<User, 'email' | 'entries'>>('users')
  pg<User, Pick<User, 'entries'>>('users')
    .where({ id })
    // .returning(['email', 'entries'])
    .increment('entries', 1)
    .returning('entries')
    .then((entries) => {
      console.log(entries)
      if (entries) {
        res.json(entries[0].entries)
      } else {
        res.status(400).json('Unable to update entries')
      }
    })
    .catch((err) => {
      console.log(err)
      res.status(400).json('Unable to get entries')
    })
  // const { users } = database
  // const userIndex: number = users.findIndex((user) => user.id === id)
  // if (userIndex >= 0) {
  //   users[userIndex].entries++
  //   res.status(201).json(users[userIndex])
  // } else {
  //   res.status(400).json('Unable to update user entries')
  // }
})

app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
console.log('hi there')

/*
/ -> GET res = this is working
/signin -> POST = success/fail
/register -> POST = user
/profile/:userId -> GET = user
/image -> PUT = user

TODOs:
/profile/:userId -> PUT = user 
/profile/:userId -> DELETE = success/fail
*/
