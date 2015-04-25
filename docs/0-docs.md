#Webler Documentation

##All Resumed
```js

module.exports = {

	modules : {
		copy:{
			srcs:'[string]:require',//string array of source files to be copied
		},
		build : {
			srcRoot: '[string]:required', //root search path for files absolute file reference. ex: <script src="/absolute.js"...> will search at "srcRoot"/absolute.js,
			dstRoot: '[string]:required', //behaves link srcRoot, but are for destination target files
			types: '[string:Array]' //only types will be executed, order is maintained,
			tasks: { //[object] configuring tasks
				js: '[object]' //object delivered to UglifyJS2
				css: '[object]' //object delivered to css min,
				sass: '[object]' //object delivered to node-sass
			}
		},
		components: {
			componentsPath: null, //this is a required attribute, where to find components
			componentExt: '[string]'//file component's extension,
			attrAction: '[string]', //must be 'replace' or 'merge', merge is the default one, attributes will be merged
			attrs://object to customize the default attribute action
			{
				class:'merge',
				id:'replace',
				'custom-attribute':'replace'
			},
			parseAllHyphenTags: true,
			validateName:'[function]' //function (name){return true/false;} validates the name of the tag, by default a valid name must contain a dash (webcomponents spec)
		},
		handlebars: {
		    layoutsPath:'[string]'//default is .hbs
		}
	}
}
```

#Module
Webler is divided into modules, by now there are 3 modules:
Build,Components, Handlebars
