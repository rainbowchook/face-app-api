import { Router, Request, Response, NextFunction } from 'express'
// import { RequestWithBody } from '../server'
import { pg } from '../database'
import {
  handleSignin,
  handleRegister,
  handleProfile,
  handleUsers,
  handleImage,
  handleRemoveUser,
} from '../controllers'

const router = Router()
//TODO: middleware function to login with external identity provider ie Auth0; set cookie to end user session on timeout
// router.post('/signin', handleSignin(pg))
router.post('/signin', handleSignin())
// router.post('/', handleRegister(pg))
router.post('/', handleRegister())
// router.get('/:id', handleProfile(pg))
router.get('/:id', handleProfile())
// router.get('/', handleUsers(pg))
router.get('/', handleUsers())
// router.put('/:id/image', handleImage(pg))
router.put('/:id/image', handleImage())
// router.options('*', getCors())
// router.delete('/:id', handleRemoveUser(pg))
router.delete('/:id', handleRemoveUser())

export { router }

/*
/users/signin -> POST = success/fail
/users -> POST = user - CREATE
/users/:userId -> GET = user - READ
/users/ -> GET = users - READ
/users/:userId/images -> PUT = user - UPDATE (previously /image)
/users/:userId -> DELETE - DELETE (need app.options preflight for CORS - header not GET/HEAD/POST)
*/
