module.exports = {
  type: 'stream',//type maybe stream, or bulk
  require:['options','$','gOptions'],
  start: function(dom,options,$,gOptions) { //runtime arguments with options

  }
  //setup: function(){}, //this function is called after plugin is loaded and only once
  //config: {}, //defult object options, user may override this options, and set new ones
  //cleanUp: function(){}, // this function is called by the user and must cleanup cached stuff between multiple webler.weble() calls, if any
  //api: undefined //this might be anything you want to expose to the user
}
