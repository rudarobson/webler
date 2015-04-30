#Webler Documentation

##All Resumed
```js

module.exports = {
	build : {
		srcRoot: '[string]:required', //The directory to search when an absolute path is processed ex: <script src="/absolute.js"...> will search at "srcRoot"/absolute.js,
		dstRoot: '[string]:required', //The directory to write files when an absolute path is processed
		tasks: { //[object] configuring tasks
			js: '[object]' //object delivered to UglifyJS2
			css: '[object]' //object delivered to css min,
			sass: '[object]' //object delivered to node-sass
		},
		runAll:'[boolean]'//default is false
	},
	components: {
		componentsPath: '[string]:required', //this is a required attribute, where to find components
		componentsExt: '[string]'//file component's extension,
		attrAction: '[string]', //must be 'replace' or 'merge', merge is the default one, attributes will be merged
		attrs://object to customize the default attribute action
		{
			class:'merge',
			id:'replace',
			'custom-attribute':'replace'
		},
		stopOnNotFound: true,//????????
		validateName:'[function]' //function (name){return true/false;} validates the name of the tag, by default a valid name must contain a dash (webcomponents spec)
	},
	handlebars: {
	    layoutsPath:'[string]'//default is .hbs
	}
}
```

#Module
Webler is divided into modules, by now there are 3 modules:
Build,Components, Handlebars
