"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
// import { RequestWithBody } from '../server'
const database_1 = require("../database");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
exports.router = router;
// router.post('/signin', handleSignin(pg))
router.post('/signin', (0, controllers_1.handleSignin)());
router.post('/', (0, controllers_1.handleRegister)(database_1.pg));
router.get('/:id', (0, controllers_1.handleProfile)(database_1.pg));
// router.get('/', handleUsers(pg))
router.get('/', (0, controllers_1.handleUsers)());
router.put('/:id/image', (0, controllers_1.handleImage)(database_1.pg));
// router.options('*', getCors())
router.delete('/:id', (0, controllers_1.handleRemoveUser)(database_1.pg));
/*
/users/signin -> POST = success/fail
/users -> POST = user - CREATE
/users/:userId -> GET = user - READ
/users/ -> GET = users - READ
/users/:userId/images -> PUT = user - UPDATE (previously /image)
/users/:userId -> DELETE - DELETE (need app.options preflight for CORS - header not GET/HEAD/POST)
*/
