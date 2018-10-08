const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        app: [
            'webpack-dev-server/client?http://localhost:8080',
            './src/2d'
        ]
    },
    devtool: 'source-map',
    devServer: {
        contentBase: path.resolve(__dirname, 'dist'),
        hot: true
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '..', 'dist')
    },
    node: {
        fs: 'empty'
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: [
            '.js', '.html'
        ]
    },
    plugins: [
        new CleanWebpackPlugin(['dist'], { verbose: true, root: path.resolve(__dirname) }),
        new HtmlWebpackPlugin({
            template: './static/index.html'
        }),
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, './static'),
                to: 'static'
            }
        ]),
        new webpack.IgnorePlugin(/vertx/),
        new webpack.HotModuleReplacementPlugin(),
    ]
};