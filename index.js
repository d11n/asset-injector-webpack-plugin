(function main(WEBPACK) {
    const package_name = 'asset-injector-webpack-plugin';
    return module.exports = asset_injector_webpack_plugin;

    // -----------
    function asset_injector_webpack_plugin(...unused_args) {
        this !== (global || window)
            && error('execute without the `new` keyword')
            ;
        unused_args.length > 0
            && warn('no arguments are supported.'
                + ` \`${ unused_args }\` will be ignored`
                )
            ;
        const regex_needle = /<!--\s*asset[-_]inject(?:or|ion)(?:[-_]webpack)?(?:[-_]plugin)?\s+(?:([\w-]+)\s+)?([\w.-/\\]+)\s*-->/im;
        return asset_injector;

        function asset_injector() {
            const compiler = this;
            compiler.plugin('emit', inject_asset_references);
            return true;
        }

        function inject_asset_references(compilation, callback) {
            const assets_dict = compilation.assets;
            const public_path = compilation.outputOptions.publicPath;
            const token_dict = {};
            for (let i = 0, n = compilation.chunks.length - 1; i <= n; i++) {
                const chunk = compilation.chunks[i];
                const assets = Array.prototype.concat.apply([],
                    chunk.mapModules(pull_out_assets),
                    );
                const output_file_names = chunk.files
                    .concat(assets)
                    .filter(exclude_suppressed_files)
                    .map(map_output_file_names)
                    ;
                token_dict[chunk.name] = output_file_names;
            }
            for (const filename in assets_dict) {
                if ('.html' === filename.substr(-5)) {
                    assets_dict[filename] = parse_html_asset({
                        asset: assets_dict[filename],
                        token_dict,
                        });
                }
            }
            return callback && callback();

            // -----------

            function pull_out_assets(module) {
                return Object.keys(module.assets);
            }
            function exclude_suppressed_files(output_file_name) {
                return assets_dict[output_file_name];
            }
            function map_output_file_names(file_name) {
                return `${ public_path }${ file_name }`;
            }
        }

        function parse_html_asset(params) {
            const { asset, token_dict } = params;
            const html_string = asset.source().toString('utf-8');
            const parsed_html_string = replace_needles(html_string);
            const parsed_html_buffer = Buffer.from(parsed_html_string, 'utf-8');
            return new asset.constructor(parsed_html_buffer);

            // -----------

            function replace_needles(content) {
                let new_content = content;
                let matches;
                while (matches = regex_needle.exec(new_content)) {
                    const [ needle, raw_tag, asset_ident ] = matches;
                    new_content = replace_needle({
                        content: new_content,
                        search_string: needle,
                        asset_urls: find_in_token_dict(asset_ident),
                        asset_ident,
                        tag: which_tag(raw_tag),
                        });
                }
                return new_content;
            }

            // Don't assume a developer knows how webpack names chunks
            function find_in_token_dict(asset_ident) {
                if (token_dict[asset_ident]) {
                    return token_dict[asset_ident];
                }
                const last_dot_index = asset_ident.lastIndexOf('.');
                const basename = last_dot_index > 0
                    ? asset_ident.substring(0, last_dot_index)
                    : asset_ident
                    ;
                const extension = last_dot_index > 0
                    ? asset_ident.substring(last_dot_index + 1)
                    : null
                    ;
                switch (extension) {
                    case 'js':
                    case 'jsx':
                        return find_js_in_token_dict();
                    case 'css':
                    case 'scss':
                        return find_css_in_token_dict();
                }
                return find_js_in_token_dict() || find_css_in_token_dict();

                // -----------

                function find_js_in_token_dict() {
                    return token_dict[basename]
                        || token_dict[ `${ asset_ident }.js` ]
                        || token_dict[ `${ basename }.js` ]
                        || token_dict[ `${ asset_ident }.jsx` ]
                        || token_dict[ `${ basename }.jsx` ]
                        ;
                }
                function find_css_in_token_dict() {
                    return token_dict[ `${ asset_ident }.css` ]
                        || token_dict[ `${ basename }.css` ]
                        || token_dict[ `${ asset_ident }.scss` ]
                        || token_dict[ `${ basename }.scss` ]
                        ;
                }
            }

            function which_tag(raw_tag) {
                switch (raw_tag) {
                    case 'style':
                    case 'styles':
                    case 'stylesheet':
                        return 'style';
                    case 'script':
                    case 'scripts':
                        return 'script';
                }
                return null;
            }

            function replace_needle(replace_params) {
                const { content, search_string, asset_urls } = replace_params;
                let replace_string = '';
                if (!asset_urls || 0 === asset_urls.length) {
                    const asset_ident = replace_params.asset_ident;
                    replace_string = search_string
                        .replace(asset_ident, `¿¿¿${ asset_ident }???`)
                        ;
                    return content.replace(search_string, replace_string);
                }
                const tag = replace_params.tag;
                for (let i = 0, n = asset_urls.length - 1; i <= n; i++) {
                    const url = asset_urls[i];
                    if ('.js' === url.substr(-3) && 'style' !== tag) {
                        replace_string += `<script src="${ url }"></script>`;
                    } else if ('.css' === url.substr(-4) && 'script' !== tag) {
                        replace_string
                            += `<link rel="stylesheet" href="${ url }"/>`
                            ;
                    }
                }
                return content.replace(search_string, replace_string);
            }
        }
    }

    function error(message) {
        WEBPACK.emitError(`${ package_name }: ${ message }.`);
    }
    function warn(message) {
        WEBPACK.emitWarning(`${ package_name }: ${ message }.`);
    }
}(
    require('webpack')
));
