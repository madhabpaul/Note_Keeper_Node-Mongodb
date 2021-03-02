const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/keepapp', {useNewUrlParser: true, useCreateIndex: false, useUnifiedTopology: true});
var conn =mongoose.Collection;
var messageSchema =new mongoose.Schema({
    categoryOption: {type:String, 
        required: true,
        },
    message: {type:String, 
        required: true,
        },
    date:{
        type: Date, 
        default: Date.now }
});

var messageModel = mongoose.model('message', messageSchema);
module.exports=messageModel;