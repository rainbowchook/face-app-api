import express, { Request, Response } from 'express'
import cors from 'cors'
import 'dotenv/config'
import { database, User } from './database'

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
  const { users } = database
  res.json(users)
  // res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`)
})

app.post('/signin', cors(corsOptions), (req: RequestWithBody, res: Response) => {
  const { email, password } = req.body
  const { users } = database
  if (email && password && email === users[0].email && password === users[0].password) {
    res.json('success')
  } else {
    res.status(400).json('error logging in')
  }
  // res.json('signin is working')
})

app.post('/register', cors(corsOptions), (req: RequestWithBody, res: Response) => {
  const { name, email, password } = req.body
  const { users } = database
  if(name && email && password) {
    const newUser: User = {
      id: String(Number(users[users.length - 1].id) + 1),
      name,
      email,
      password,
      entries: 0,
      joined: new Date()
    }
    users.push(newUser)
    const returnedUser = {...newUser} as Partial<User>
    delete returnedUser.id
    res.status(201).json(returnedUser)
    //or return the last item in the array: res.json(users[users.length - 1])
  } else {
    res.status(400).json('Invalid credentials')
  }
})

app.get('/profile/:id', cors(corsOptions), (req: Request, res: Response) => {
  const { id } = req.params
  const { users } = database
  const user: User | undefined = users.find(user => user.id === id)
  if(user) {
    res.json(user)
  } else {
    res.status(404).json('user not found')
  }
})

app.put('/image', cors(corsOptions), (req: RequestWithBody, res: Response) => {
  const { email } = req.body
  const { users } = database
  const userIndex: number = users.findIndex(user => user.email === email)
  if(userIndex >= 0) {
    users[userIndex].entries++
    res.status(201).json(users[userIndex])
  } else {
    res.status(400).json('Unable to update user entries')
  }
})

app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
console.log('hi there')

/*
/ -> GET res = this is working
/signin -> POST = success/fail
/register -> POST = user
/profile/:userId -> GET = user
/image -> PUT = user
*/
