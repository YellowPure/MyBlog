var mongodb=require('./db');
function Comment(name,day,title,comment){
	this.name=name,
	this.title=title,
	this.day=day,
	this.comment=comment;
}
module.exports=Comment;
Comment.prototype.save=function(callback){
	var name=this.name,
		title=this.title,
		day=this.day,
		comment=this.comment;
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.update({
				'name':name,
				'time.day':day,
				'title':title
			},{$push:{'comments':comment}},function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				console.log('comments:',comment);
				callback(null);
			})
		});
	});
}