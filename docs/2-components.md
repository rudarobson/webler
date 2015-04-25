##Components
Components try to simluate the webcomponents behavior for custom tags. Actually only provide
support for the html template, no scripts nor styles.

##Example: How to use it
1- Create a components folder.
2- Create a file named simple-component.html
3- The file must have a root tag, use <div> for example, for purpose of using attributes

```Html
<div>
    "your custom template goes inside here"
</div>
```

4- Create an usual index.html
```Html
<!DOCTYPE html>
<html>
    <body>
        <simple-component id="hereWeGo" attribute1="value1"></simple-component>
    </body>
</html>
```
Will Generate
```Html
<!DOCTYPE html>
<html>
    <body>
        <div id="hereWeGo" attribute1="value1">
            "your custom template goes inside here"
        </div>
    </body>
</html>
```

##See the attributes in the div? that's why you need a root tag, pick any valid html tag.

Take a look how to use the content tag, it's in web components specs and web tutorials ;)
```Html
<content select".a.css.selector"></content>
```
