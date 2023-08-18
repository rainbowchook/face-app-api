"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
exports.router = router;
//TODO: middleware function to login with external identity provider ie Auth0; set cookie to end user session on timeout
router.post('/signin', (0, controllers_1.handleSignin)());
router.post('/', (0, controllers_1.handleRegister)());
router.get('/:id', (0, controllers_1.handleProfile)());
router.get('/', (0, controllers_1.handleUsers)());
router.put('/:id/image', (0, controllers_1.handleImage)());
router.delete('/:id', (0, controllers_1.handleRemoveUser)());
/*
/users/signin -> POST = success/fail
/users -> POST = user - CREATE
/users/:userId -> GET = user - READ
/users/ -> GET = users - READ
/users/:userId/images -> PUT = user - UPDATE (previously /image)
/users/:userId -> DELETE - DELETE (need app.options preflight for CORS - header not GET/HEAD/POST)
*/
