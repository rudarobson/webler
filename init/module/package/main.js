module.exports = {
  type: 'stream',//type maybe stream, or bulk
  start: function(options) { //runtime arguments with options

  }
  //setup: function(){}, //this function is called after plugin is loaded and only once
  //config: function(options){}, //this function is called by the user to override defaults options with the options argument "user may call it many times"
  //cleanUp: function(){}, // this function is called by the user and must cleanup cached stuff between multiple webler.weble() calls, if any
  //api: undefined //this might be anything you want to expose to the user
}
