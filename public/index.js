
window.onbeforeunload = function(){
	window.scrollTo(0,0);
}
$(document).ready(function(){})

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
	var pass = $('#id_password_input').val()
	var user = $('#id_username_input').val()
	if(pass.length==0 || user.length==0){
		$('#id_auth-warn-empty').css('display','block')
	} else {
		$.post('/api/authenticate',{user:user,pass:pass},function(answer){
			console.log(answer)
		})
		$('#id_auth-modal-footer').css('display','none')
		$('#id_auth-warn-empty').css('display','none')
		$('#id_auth').css('display','none')
		$('#id_auth-loader').css('display','block')
	}
}

var closeAuthModal = function(){//delete
	$('#id_auth-modal-footer').css('display','block')
	$('#id_auth').css('display','block')
	$('#id_auth-loader').css('display','none')
	$('#id_auth-warn-empty').css('display','none')
	$('#id_password_input').val("")
	$('#id_username_input').val("")
}
