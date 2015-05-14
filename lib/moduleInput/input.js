var inputTypes = {};

inputTypes.string = {
  toString: function(content) {
    return content;
  },
  toDom: function(content) {
    throw 'must call cheerio';
  }
}

inputType.dom = {
  toString: function(content) {
    throw 'must return cheerio to string';
  },
  toDom: function(content) {
    return content;
  }
}

inputType.file = {
  toString: function(content) {
    return fs.readFileSync(content);
  },
  toDom: function(content) {
    throw 'must call cheerio';
    return fs.readFileSync(content);
    return content;
  }
}
