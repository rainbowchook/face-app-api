"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.options('*', (0, cors_1.default)());
const corsOptions = {
    origin: true,
    optionsSuccessStatus: 200
};
app.get('/', (0, cors_1.default)(), (req, res) => {
    res.send(`Reached cors-enabled site in ${process.env.NODE_ENV}`);
});
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
console.log('hi there');
/*
/ -> GET res = this is working
/signin -> POST = success/fail
/register -> POST = user
/profile/:userId -> GET = user
/image -> PUT = user
*/ 
