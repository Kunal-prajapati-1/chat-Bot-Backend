const express = require('express');
const authentication = require('../middleware/auth.middleware');
const {postChat, getChats, getMsg} = require('../controllers/chat.controller')
const routes = express.Router()

routes.post('/',authentication, postChat)
routes.get('/',authentication,getChats)
routes.get('/:id',authentication,getMsg)

module.exports = routes;