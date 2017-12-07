# Asset Injector (Webpack plugin)

### Simply inject CSS and JavaScript assets into HTML assets with Webpack

Asset Injector is a simple, lightweight way to put `<link>` and `<script>` tags where you want them in your HTML files. When such a basic task is what you need, something like [HTML Webpack Plugin](https://github.com/jantimon/html-webpack-plugin) can be overkill and needlessly balloon your build time.

<br/>

## Installation

```shell
$ npm install asset-injector-webpack-plugin --save-dev
```

<br/>

## Basic Usage

Asset Injector replaces structured comments in HTML files with `<link>` and/or `<script>` tags that reference the compiled asset(s) for a given chunk name.

##### `webpack.config.js`

```javascript
...

const asset_injector = require('asset-suppressor-webpack-plugin');

...

webpack_config.entry = {
    index: './index.js',
    'index.css': './index.css',
    'index.html': './index.html',
    };

...

const Commons_chunk = webpack.optimize.CommonsChunkPlugin;
webpack_config.plugins = [
    new Commons_chunk({ name: 'lib', minChunks: is_from_npm }),
    new Commons_chunk({ name: 'liaison', minChunks: Infinity }), // sometimes called "manifest"
    asset_injector(),
    ];

...

function is_from_npm(module) {
    return module.context && -1 !== module.context.indexOf('node_modules');
}

...
```


##### `index.html`

```html
<html>
<head>
    <meta charset="utf-8"/>
    <title>App</title>
    <!-- asset-injector index.css -->
    <!-- asset-injector liaison -->
    <!-- asset-injector lib -->
</head>
<body>
    <div id="app"></div>
    <!-- asset-injector index -->
</body>
</html>
```

<br/>

## Gotchas

Because it is not always obvious what assets Webpack will output for a given chunk, Asset Injector seeks to be lenient while specific.

For the `index.css` entry point in the earlier example, `<!-- asset-injector index.css -->` will be replaced with something like:

```html
<script src="/3786e0d596e0453.js"></script><link rel="stylesheet" href="/3786e0d596e0453ebb5e29dbc2dbcc4a.css"/>
```

This is because all entry points result in a `.js` file being output (and generally a `.js.map` file too). To specify only the stylesheet, each of the following will only inject the `<link>` tag:

```html
<!-- asset-injector style index.css -->
<!-- asset-injector styles index.css -->
<!-- asset-injector stylesheet index.css -->
<!-- asset-injector-plugin style index.css -->
<!-- asset-injector-webpack-plugin styles index.css -->
<!-- asset_injector_webpack_plugin stylesheet index.css -->
```

The same is true for `<script>` tags:

```html
<!-- asset-injector script lib -->
<!-- asset-injector scripts lib -->
```

And because it is also not always obvious what Webpack chunks' names are, Asset Injector attempts to figure out what you intended if a chunk name isn't found. For example, simple mistakes like the following will do what you expect:

`<!-- asset-injector lib.js -->` will work if the chunk name is technically `lib`

`<!-- asset-injector styles.css -->` will work if the chunk name is technically `styles.scss` (SASS file) or `styles`
