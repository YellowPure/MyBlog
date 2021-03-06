/*
 * GET home page.
 */
var crypto = require('crypto'),
	Post = require('../models/post.js'),
	User = require('../models/user.js'),
	passport = require('passport'),
	fs = require('fs'),
	Comment = require('../models/comment.js');
module.exports = function(app) {
	app.get('/', function(req, res) {
		var page = req.query.p ? parseInt(req.query.p) : 1;
		Post.getTen(null, page, function(err, posts, total) {
			if (err) {
				posts = [];
			}
			res.render('index', {
				title: '主页',
				user: req.session.user,
				page: page,
				isFirstPage: (page - 1) == 0,
				isLastPage: (page - 1) * 10 + posts.length == total,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res) {
		res.render('reg', {
			title: "注册",
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});

	});
	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res) {
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['repPassword'];
		if (name == '') {
			req.flash('error', '请填写用户名！');
			return res.redirect('/reg'); //返回注册页
		}
		if (password == '') {
			req.flash('error', '请填写密码！');
			return res.redirect('/reg'); //返回注册页
		}
		if (password != password_re) {
			req.flash('error', '两次输入密码不一致！');
			return res.redirect('/reg'); //返回注册页
		}
		if (req.body.email == '') {
			req.flash('error', '请填写邮箱！');
			return res.redirect('/reg'); //返回注册页
		}
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: req.body.name,
			password: password,
			email: req.body.email
		});
		User.get(newUser.name, function(err, user) {
			if (user) {
				req.flash('error', '用户已存在！');
				console.log('用户已存在！');
				return res.redirect('/reg');
			}
			newUser.save(function(err, user) {
				if (err) {
					req.flash('error', err);
					return res.redirect('/reg');
				}
				req.session.user = user;
				req.flash('success', '注册成功！');
				console.log('success reg!!!');
				res.redirect('/'); //注册成功后返回主页
			})
		});
	});
	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.render('login', {
			title: "登录",
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res) {
		console.log('open login page!!!!!!');
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		User.get(req.body.name, function(err, user) {
			if (!user) {
				req.flash('error', '用户不存在！');
				console.log('用户不存在！');
				return res.redirect('/login');
			}
			if (user.password != password) {
				req.flash('error', '密码错误!');
				console.log('密码错误！');
				return res.redirect('/login');
			}
			console.log('登录成功！');
			req.session.user = user;
			req.flash('success', '登录成功！');
			res.redirect('/');
		});
	});
	app.get('/login/github', passport.authenticate('github',{session:false}));
	app.get('/login/github/callback', passport.authenticate('github', {
		session: false,
		failureRedirect: '/login',
		successFlash: '登陆成功！'
	}), function(req, res) {
		console.log('登录成功！！');
		req.session.user = {
			name: req.user.username,
			head: "https://gravatar.com/avatar/" + req.user._json.gravatar_id + "?s=48"
		};
		res.redirect('/');
	});
	app.get('/post', checkLogin);
	app.get('/post', function(req, res) {
		res.render('post', {
			title: '发表',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	});
	app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		var currentUser = req.session.user,
			tags = [req.body.tag1, req.body.tag2, req.body.tag3];
		post = new Post(currentUser.name, req.body.title, tags, req.body.post);
		post.save(function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '发表成功！');
			res.redirect('/');
		});
	});
	app.get('/loginout', checkLogin);
	app.get('/loginout', function(req, res) {
		// res.render('/',{title:"主页"});
		console.log('登出成功！');
		req.session.user = null;
		req.flash('success', '登出成功！');
		res.redirect('/');
		// res.render('post',{title:"发表"});
	});
	app.get('/upload', checkLogin);
	app.get('/upload', function(req, res) {
		res.render('upload', {
			title: '上传',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	});
	app.post('/upload', checkLogin);
	app.post('/upload', function(req, res) {
		for (var i in req.files) {
			if (req.files[i].size == 0) {
				fs.unlinkSync(req.files[i].path);
				console.log('successfully removed an empty file');
			} else {
				var target_path = './public/images/' + req.files[i].name;
				fs.renameSync(req.files[i].path, target_path);
				console.log('successfully renamed a file');
			}
		}
		req.flash('success', '文件上传成功');
		res.redirect('/upload');
	});
	app.get('/u/:name', function(req, res) {
		var page = req.query.p ? parseInt(req.query.p) : 1;
		User.get(req.params.name, function(err, user) {
			if (!user) {
				req.flash('error', '用户不存在！');
				return res.redirect('/');
			}
			Post.getTen(null, page, function(err, posts, total) {
				if (err) {
					posts = [];
				}
				res.render('user', {
					title: user.name,
					isFirstPage: (page - 1) == 0,
					isLastPage: (page - 1) * 10 + posts.length == total,
					user: req.session.user,
					page: page,
					posts: posts,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});


	app.get('/p/:_id', function(req, res) {
		Post.getOne(req.params._id, function(err, post) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('article', {
				title: post.title,
				user: req.session.user,
				post: post,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			})
		});
	});
	app.post('/p/:_id', function(req, res) {
		var date = new Date();
		var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
		var comment = {
			name: req.body.name,
			time: time,
			email: req.body.email,
			website: req.body.website,
			content: req.body.content
		}
		var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
		newComment.save(function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '留言成功');
			res.redirect('back');
		});
	});
	app.get('/edit/:_id', checkLogin);
	app.get('/edit/:_id', function(req, res) {
		var currentUser = req.session.user;
		// console.log('currentUser:',currentUser.name,req.params.day,req.params.title,req.params);
		Post.edit(req.params._id, function(err, post) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/back');
			}
			res.render('edit', {
				title: '编辑',
				user: req.session.user,
				post: post,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			})
		});
	});
	app.post('/edit/:_id', checkLogin);
	app.post('/edit/:_id', function(req, res) {
		var currentUser = req.session.user;
		Post.update(req.params._id, req.body.post, function(err, post) {
			var url = '/p/' + req.params._id;
			if (err) {
				req.flash('error', err);
				return res.redirect(url);
			}
			req.flash('success', '修改成功！');
			res.redirect(url);
		});
	});
	app.get('/remove/:_id', checkLogin);
	app.get('/remove/:_id', function(req, res) {
		var currentUser = req.session.user;
		Post.remove(req.params._id, function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success', '修改成功！');
			res.redirect('/');
		});
	});
	app.get('/archive', function(req, res) {
		Post.getArchive(function(err, posts) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('archive', {
				title: '存档',
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/tags', function(req, res) {
		Post.getTags(function(err, posts) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('tags', {
				title: '标签',
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/tags/:tag', function(req, res) {
		Post.getTag(req.params.tag, function(err, posts) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('tag', {
				title: 'TAG：' + req.params.tag,
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		})
	})
	app.get('/search', function(req, res) {
		Post.search(req.query.keyword, function(err, posts) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('search', {
				title: 'SEARCH：' + req.query.keyword,
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		})
	})
	app.get('/links', function(req, res) {
		res.render('links', {
			title: '友情链接',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		})
	})
	app.use(function(req, res) {
		res.render('404');
	})

	function checkLogin(req, res, next) {
		if (!req.session.user) {
			req.flash('error', '未登录！');
			return res.redirect('/login');
		}
		next();
	}

	function checkNotLogin(req, res, next) {
		if (req.session.user) {
			req.flash('error', '已登录！');
			return res.redirect('back');
		}
		next();
	}

}