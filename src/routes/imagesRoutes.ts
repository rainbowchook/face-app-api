import { Router, Request, Response, NextFunction } from 'express'
import { handleImageApiCall } from '../controllers'

const router = Router()

router.use('/', handleImageApiCall())

export { router }