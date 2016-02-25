

System.ondata(function(data){
  log("sp_start")
  var sp = Uran.createSpectrum(data)
	System.push(sp);
	log("sp_end")
});
