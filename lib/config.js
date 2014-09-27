require.config( {
	baseUrl: "../lib/",
	paths: {
		log4javascript: "../bower_components/log4javascript/log4javascript"
	},
	shim: {
		log4javascript: {
			exports: 'log4javascript',
			init: function () {
				log4javascript.setDocumentReady();
			}
		}
	}
} );
