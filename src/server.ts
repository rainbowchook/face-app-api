import express, { Request, Response } from 'express'
import cors from 'cors'
// import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.options('*', cors())

const corsOptions: cors.CorsOptions = {
  origin: true,
  optionsSuccessStatus: 200,
}

app.get('/', cors(), (req: Request, res: Response) => {
  res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`)
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
