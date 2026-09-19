const mongoose =  require('mongoose')
const msgSchema = mongoose.Schema({
    chat:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chat',
        required:true
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required:true
    },
    title:{
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ["user","model"],
        default: "user",
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    }
})

const msgModel = mongoose.model('msg',msgSchema)
module.exports  = msgModel;