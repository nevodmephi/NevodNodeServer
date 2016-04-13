
var auth_lodaing = false;
var token = null;

window.onbeforeunload = function(){
	window.scrollTo(0,0);
}
$(document).ready(function(){
	console.log(localStorage)
})

$('.main-container').scroll(function(){
  if($('.main-container').scrollTop()>=190){
    $('.logo').addClass('logo-visivle')
    $('.logo').removeClass('logo-unvisivle')
    $('.project-name').addClass('navbar-brand-slide')
    $('.project-name').removeClass('navbar-brand-slide-back')
  } else if($('.main-container').scrollTop()<190){
    $('.logo').removeClass('logo-visivle')
    $('.logo').addClass('logo-unvisivle')
    $('.project-name').removeClass('navbar-brand-slide')
    $('.project-name').addClass('navbar-brand-slide-back')
  }
})

var main = function(){
  // $.post('/api/authenticate',{name:"user",pass:"1"},function(data){
  //   alert(data)
  // })
  // $.ajax({type:'POST',url:'/api/authenticate',data:'{"name":"alex","password":"11"}',dataType:'json'})
}

var openAuthModal = function(){

}

var authenticate = function(){
	if(auth_lodaing){
		return
	}
	$('#id_auth-warn-empty').css('display','none')
	$('#id_auth-warn-warn').css('display','none')
	var pass = $('#id_password_input').val()
	var user = $('#id_username_input').val()
	if(pass.length==0 || user.length==0){
		$('#id_auth-warn-empty').css('display','block')
	} else {
		auth_lodaing=true;
		$.post('/api/authenticate',{user:user,pass:pass},function(answer){
			auth_lodaing=false;
			$('#id_auth-loader').css('display','none')
			if(answer.success){
				localStorage.setItem("access-token")
			} else {
				$('#id_auth-warn-warn').css('display','block')
			}
		})
		$('#id_auth-warn-empty').css('display','none')
		$('#id_auth-loader').css('display','block')
	}
}

var closeAuthModal = function(){
	$('#id_auth-loader').css('display','none')
	$('#id_auth-warn-empty').css('display','none')
	$('#id_auth-warn-warn').css('display','none')
	$('#id_password_input').val("")
	$('#id_username_input').val("")
}
