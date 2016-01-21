
System.ondata(function(data){
  if(data.length==0) {return;}
  log(data.length)
  var state = {energy:data[0].maxs,neutrons:data[0].neutrons}
  Online.controllState(state);
});
