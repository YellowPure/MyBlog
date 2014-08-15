var Global=function(){
	this.init=function(){
		this.bindRegister();
	}
	this.bindRegister=function(){
		$('#registerForm').on('submit',function(e){
			if($('input[name=name]').val()==''){
				e.preventDefault();
				alert('请填写用户名！');
			}else if($('input[name=password]').val()==''){
				e.preventDefault();
				alert('请填写密码！');
			}else if($('input[name=repPassword]').val()==''){
				e.preventDefault();
				alert('请再次输入密码！');
			}else if($('input[name=email]').val()==''){
				e.preventDefault();
				alert('请填写邮箱！');
			}
			
			// $.ajax({
			// 	url: 'http://127.0.0.1:3000/reg',
			// 	dataType: 'json',
			// 	data: {
			// 		name:$('input[name=name]').val(),
			// 		password:$('input[name=password]').val(),
			// 		repPassword:$('input[name=repPassword]').val(),
			// 		email:$('input[name=email]').val(),
			// 	},
			// 	timeout:5000,
			// 	success:function(data){
			// 		var data=$.parseJSON(data);
			// 	},
			// 	error:function(jqXHR,textStatus,errorThown){
			// 		alert('error'+textStatus+" "+'errorThown',jqXHR);
			// 	}
			// });
		});
	}
}
$(function(){
	var global=new Global();
	global.init();
})