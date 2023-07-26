import express, { Request, Response } from 'express'
import cors from 'cors'
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { pg, User, Login } from './database'
// import knex from 'knex'
import { handleSignin } from './controllers/signin'
import { handleRegister } from './controllers/register'
import { handleProfile } from './controllers/profile'
import { handleImage } from './controllers/image'

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

export interface RequestWithBody extends Request {
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
  handleSignin(pg)
)

app.post(
  '/register',
  cors(corsOptions),
  handleRegister(pg)
)

app.get('/profile/:id', cors(corsOptions), handleProfile(pg))

app.put('/image', cors(corsOptions), handleImage(pg))

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
