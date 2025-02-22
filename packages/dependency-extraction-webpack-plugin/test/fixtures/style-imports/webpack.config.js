/**
 * External dependencies
 */
const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );

/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	plugins: [
		new DependencyExtractionWebpackPlugin( {
			requestToExternalModule( request ) {
				if ( request.startsWith( '@wordpress/' ) ) {
					return request;
				}
			},
		} ),
		new MiniCSSExtractPlugin(),
	],
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					{
						loader: MiniCSSExtractPlugin.loader,
					},
					{
						loader: require.resolve( 'css-loader' ),
					},
				],
			},
		],
	},
};
