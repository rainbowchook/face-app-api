import { Router, Request, Response, NextFunction } from 'express'
// import { RequestWithBody } from '../server'
import { pg } from '../database'
import { 
  handleSignin, 
  handleRegister, 
  handleProfile, 
  handleUsers, 
  handleImage, 
  handleRemoveUser 
} from '../controllers'

const router = Router()

router.post('/signin', handleSignin(pg))
router.post('/', handleRegister(pg))
router.get('/:id', handleProfile(pg))
router.get('/', handleUsers(pg))
router.put('/:id/image', handleImage(pg))
// router.options('*', getCors())
router.delete('/:id', handleRemoveUser(pg))

export { router }

/*
/users/signin -> POST = success/fail
/users -> POST = user - CREATE
/users/:userId -> GET = user - READ
/users/ -> GET = users - READ
/users/:userId/images -> PUT = user - UPDATE (previously /image)
/users/:userId -> DELETE - DELETE (need app.options preflight for CORS - header not GET/HEAD/POST)
*/