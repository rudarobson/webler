/**
 * @class ServerParams
 * @prop {int} port - port to listen deafult is 8080
 * @prop {string} host - host to listen for default is 0.0.0.0
 * @prop {string} root - directory to listen for
 * @prop {boolean} openBrowser - open broser window
 */
export = {

  /**
   * launch - launch a web server
   *
   * @param  {ServerParmas} p description
   */
  launch: function(p) {
    var liveServer = require("live-server");

    var params = {
      port: p.port || 8080, // Set the server port. Defaults to 8080.
      host: p.host || '0.0.0.0', // Set the address to bind to. Defaults to 0.0.0.0.
      root: p.root, // Set root directory that's being server. Defaults to cwd.
      open: p.open || false // When false, it won't load your browser by default.
    };
    
    liveServer.start(params);
  }

}
