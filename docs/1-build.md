##Build
Build is a task executor, is designed mostly to run tasks agains files.
eg: compress, minify, js, css and compile sass.

##Syntax:
```html
<!-- build:type (optional_relative_path) target_file -->
    html tags referecncing files
<!-- /build -->
```
By default there are three types: js,css,sass

###js:
js uses UglifyJS2 at http://lisperator.net/uglifyjs/
```html
<!-- build:js target.js-->
    <script type="text/javascript" src="js_file1.js" ></script>
    <script type="text/javascript" src="js_file2.js" ></script>
<!-- /build:js -->
```

The output will be a file,concatenated,compressed,minified and uglified,named "target.js":
the js type will:
0- Generate the same html with all script tags replaced by
```html
<script type="text/javascript" src="target.js" ></script>
```
1- Concatenate js_file1.js and js_file2.js in that order.
2- Apply UglifyJS2 on those.
3- Save the resulted file to target.js at destination.

###css:
css uses clean-css at https://github.com/jakubpawlowicz/clean-css
```html
<!-- build:css target.css-->
    <link rel="stylesheet" type="text/css" href="css_file1.css" />
    <link rel="stylesheet" type="text/css" href="css_file1.css" />
<!-- /build:js -->
```
The output will be a file,concatenated and compressed,named "target.css":

###sass:
Sass uses node-sass at https://github.com/sass/node-sass

A note about sass, nowadays node-sass has a problem while using imports and the data option,
so you must supply a single file importing all other files, sorry but for now it depends on node-sass

```html
<!-- build:sass target.css-->
    <link rel="stylesheet" type="text/css" href="sass_file1_using_imports.scss" />
<!-- /build:js -->
```
The output will be a file,compiled,concatenated and compressed,named "target.css":
