"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const usersRoutes_1 = require("./routes/usersRoutes");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const allowedOrigins = [`http://localhost:${PORT}`];
const corsOptions = {
    // origin: true,
    origin: allowedOrigins,
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
app.options(allowedOrigins, (0, cors_1.default)());
app.use(express_1.default.json());
app.use('/users', usersRoutes_1.router);
app.get('/', (req, res) => {
    res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`);
});
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
console.log('hi there');
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
