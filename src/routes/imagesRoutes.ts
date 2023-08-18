import { Router } from 'express'
import { handleImageApiCall } from '../controllers'

const router = Router()

router.post('/', handleImageApiCall())

export { router }