var Db = require('./db');
// var markdown = require('markdown').markdown;
var ObjectID=require('mongodb').ObjectID;
var poolModule=require('generic-pool');
var assert = require('assert');
var async=require('async');
var pool=poolModule.Pool({
	name:'mongoPool',
	create:function(callback){
		var mongodb=Db();
		mongodb.open(function(err,db){
			callback(err,db);
		})
	},
	destroy:function(mongodb){
		mongodb.close();
	},
	max:100,
	min:5,
	idleTimeoutMillis:30000,
	log:true
});

function Post(name, title,tags, post) {
	this.name = name;
	this.title = title;
	this.post = post;
	this.tags = tags;
}
module.exports = Post;

Post.prototype.save = function(callback) {
	var date = new Date();
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + '-' + (date.getMonth() + 1),
		day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
		minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};
	var post = {
		name: this.name,
		time: time,
		title: this.title,
		post: this.post,
		tags: this.tags,
		comments: [],
		pv:0
	}
	async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			});
		},
		function(db,cb){
			db.collection('posts',function(err,collection){
				cb(err,collection,db);
			})
		},
		function(collection,db,cb){
			collection.insert(post,{save:true},function(err,post){
				cb(err,collection,db);
			});
		}
	],function(err,collection,db){
		pool.release(db);
		callback(null);
	});
	// pool.acquire(function(err, db) {
	// 	if (err) {
	// 		return callback(err);
	// 	}
	// 	db.collection('posts', function(err, collection) {
	// 		if (err) {
	// 			pool.release(db);
	// 			return callback(err);
	// 		}
	// 		collection.insert(post, {
	// 			save: true
	// 		}, function(err, post) {
	// 			pool.release(db);
	// 			if (err) {
	// 				return callback(err);
	// 			}
	// 			callback(null);
	// 		})
	// 	});
	// })
}
// Post.afterOpenDb=function(err,db,callback){
// 	if (err) {return callback(err)};
// }
// Post.getTen = function(name, page, callback) {
// 	pool.acquire(Post.afterOpenDb);
// }
Post.getTen = function(name, page, callback) {
	pool.acquire(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				pool.release(db);
				return callback(err);
			}
			var query = {};
			if (name) {
				query.name = name;
			}
			collection.count(query, function(err, total) {
				if (err) {
					return callback(err);
				}
				collection.find(query, {
					skip: (page - 1) * 10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function(err, docs) {
					pool.release(db);
					if (err) {
						return callback(err);
					}
					// docs.forEach(function(doc) {
					// 	doc.post = markdown.toHTML(doc.post);
					// });
					callback(null, docs, total);
				});
			})

		});
	});
}
Post.getOne = function(_id, callback) {
	pool.acquire(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				pool.release(db);
				return callback(err);
			}
			collection.findOne({
				"_id":new ObjectID(_id)
			}, function(err, doc) {
				if (err) {
					pool.release(db);
					return callback(arr);
				}
				if (doc) {
					collection.update({
						"_id":new ObjectID(_id)
					},{$inc:{"pv":1}},function(err){
						pool.release(db);
						if(err){
							return callback(err);
						}
					});
					// doc.post = markdown.toHTML(doc.post);
					// doc.comments.forEach(function(comment) {
					// 	console.log('comment.content', comment.content);
					// 	comment.content = markdown.toHTML(comment.content);
					// });
					callback(null, doc);
				}
			})
		});
	});
}
Post.edit = function(_id, callback) {
	pool.acquire(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				pool.release(db);
				return callback(err);
			}
			collection.findOne({
				"_id":new ObjectID(_id)
			}, function(err, doc) {
				pool.release(db);
				if (err) {
					return callback(arr);
				}
				callback(null, doc);
			})
		});
	});
}
Post.update = function(_id, post, callback) {
	pool.acquire(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				pool.release(db);
				return callback(err);
			}
			collection.update({
				"_id":new ObjectID(_id)
			}, {
				$set: {
					post: post
				}
			}, function(err, doc) {
				pool.release(db);
				if (err) {
					return callback(err);
				}
				callback(null);
			})
		});
	});
}
Post.remove = function(_id, callback) {
	pool.acquire(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				pool.release(db);
				return callback(err);
			}
			collection.remove({
				"_id":new ObjectID(_id)
			}, {
				w: 1
			}, function(err, doc) {
				pool.release(db);
				if (err) {
					return callback(arr);
				}
				callback(null);
			})
		});
	});
}
Post.getArchive = function(callback) {
	pool.acquire(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				pool.release(db);
				return callback(err);
			}
			collection.find({}, {
				'name': 1,
				'title': 1,
				'time': 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				pool.release(db);
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			})
		});
	});
}
Post.getTags = function(callback) {
	pool.acquire(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				pool.release(db);
				return callback(err);
			}
			collection.distinct('tags', function(err, docs) {
				pool.release(db);
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			})
		})
	})
}
Post.getTag = function(tag, callback) {
	pool.acquire(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				pool.release(db);
				return callback(err);
			}
			collection.find({"tags":tag},{
				"name":1,
				"title":1,
				"time":1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				pool.release(db);
				if(err){
					callback(err);
				}
				callback(null,docs);
			})
		})
	});
}
Post.search = function(keyword, callback) {
	pool.acquire(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				pool.release(db);
				return callback(err);
			}
			var pattern=new RegExp("^.*"+keyword+".*$","i");
			collection.find({"title":pattern},{
				"name":1,
				"title":1,
				"time":1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				pool.release(db);
				if(err){
					callback(err);
				}
				callback(null,docs);
			})
		})
	});
}