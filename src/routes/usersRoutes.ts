import { Router } from 'express'
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
router.post('/signin', handleSignin())
router.post('/', handleRegister())
router.get('/:id', handleProfile())
router.get('/', handleUsers())
router.put('/:id/image', handleImage())
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
