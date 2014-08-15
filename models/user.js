var Db = require('./db');
var async = require('async');
var poolModule=require('generic-pool');
var pool=poolModule.Pool({
	name:'mongoUserPool',
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
	log:false
});
// var eventEmitter=require('events').EventEmitter;
// var EventProxy=require('eventproxy');

function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
}
module.exports = User;

User.prototype.save = function(callback) {
	//要存入数据库的用户文档
	var user = {
			name: this.name,
			password: this.password,
			email: this.email
		}
	async.waterfall([
		function(cb){
			pool.acquire(function(err,db){
				cb(err,db);
			})
		},
		function(db,cb){
			db.collection('users',function(err,collection){
				cb(err,collection,db);
			});
		},
		function(collection,db,cb){
			collection.insert(user,{save:true},function(err,user){
				cb(err,user,db);
			})
		}
		],function(err,user,db){
			if(err)return callback(err);
			pool.release(db);
			callback(null,user[0]);
	})
	// 	//打开数据库
	// mongodb.open(function(err, db) {
	// 	if (err) {
	// 		return callback(err);
	// 	}
	// 	//读取user 集合
	// 	db.collection('users', function(err, collection) {
	// 		if (err) {
	// 			mongodb.close();
	// 			return callback(err);
	// 		}
	// 		//将用户数据插入users集合
	// 		collection.insert(user, {
	// 			save: true
	// 		}, function(err, user) {
	// 			mongodb.close();
	// 			if (err) {
	// 				return callback(err);
	// 			}
	// 			callback(null, user[0]);
	// 		})

	// 	});
	// })
}
User.get = function(name, callback) {
// mongodb.open(function(err, db) {
// 		if (err) {
// 			return callback(err);
// 		}
// 		db.collection('users', function(err, collection) {
// 			if (err) {
// 				mongodb.close();
// 				return callback(err);
// 			}
// 			collection.findOne({
// 				name: name
// 			}, function(err, user) {
// 				mongodb.close();
// 				if (err) {
// 					return callback(err);
// 				}
// 				callback(null, user);
// 			});
// 		});
// 	});
	async.waterfall([
		function(cb) {
			pool.acquire(function(err, db) {
				cb(err, db);
			})
		},
		function(db,cb){
			db.collection('users',function(err,collection){
				cb(err,collection,db);
			})
		},
		function (collection,db,cb){
			collection.findOne({
				name: name
			}, function(err, user) {
				cb(err,user,db);
			});
		}
	], function(err, user,db) {
		if(err){return callback(err);}
		pool.release(db);
		callback(null, user);
	});
}