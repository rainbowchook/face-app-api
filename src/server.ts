import express, { Request, Response } from 'express'
import cors from 'cors'
import 'dotenv/config'
import { router as usersRouter } from './routes/usersRoutes'
import { router as imagesRouter } from './routes/imagesRoutes'

export interface RequestWithBody extends Request {
  body: { [key: string]: string | undefined }
}

const app = express()
const PORT = process.env.PORT || 3000

const allowedOrigins: string[] = [`http://localhost:${PORT}`, '*']

const corsOptions: cors.CorsOptions = {
  // origin: true,
  origin: allowedOrigins,
  optionsSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.options(allowedOrigins, cors())

app.use(express.json())
app.use('/users', usersRouter)
app.use('/images', imagesRouter)

app.get('/', (req: Request, res: Response) => {
  res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`)
})

app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
console.log('hi there')

/*
NEW ROUTES (RESTful convention for CRUD operations):
/ -> GET res = this is working
/users/signin -> POST = success/fail
/users -> POST = user - CREATE
/users/:userId -> GET = user - READ
/users/ -> GET = users - READ
/users/:userId/images -> PUT = user - UPDATE (previously /image)
TODO /users/:userId -> DELETE - DELETE (need app.options preflight for CORS - header not GET/HEAD/POST)
TODO /images/ -> POST - Make API call with image; returns JSON results

OLD ROUTES:
/ -> GET res = this is working
/signin -> POST = success/fail : /users/signin
/register -> POST = user : /users/register
/profile/:userId -> GET = user : /users/:userId
/image -> PUT = user : /users/:userId/images

*/
