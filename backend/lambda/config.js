"use strict";
exports.__esModule = true;
exports.config = void 0;
exports.config = {
    tables: {
        imports: process.env.IMPORTS_TABLE || 'housef2-imports-dev',
        main: process.env.MAIN_TABLE || 'housef2-main-dev'
    },
    s3: {
        importBucket: process.env.IMPORT_BUCKET || 'housef2-imports-dev'
    }
}; 