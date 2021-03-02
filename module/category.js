const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
mongoose.connect('mongodb://localhost:27017/keepapp', {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true});
var conn =mongoose.Collection;
var categorySchema =new mongoose.Schema({
    categoryName: {type:String, 
        required: true,
        index: {
            unique: true,        
        }},
    date:{
        type: Date, 
        default: Date.now }
});
categorySchema.plugin(mongoosePaginate);
var categoryModel = mongoose.model('category', categorySchema);
module.exports=categoryModel;