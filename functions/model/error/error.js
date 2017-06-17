"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isError(code) {
    if (code === void 0)
        return false;
    if (typeof code != 'string')
        return false;
    if (!code)
        return false;
    if (exports.ERROR['code'] === void 0)
        return false;
    return true;
}
exports.isError = isError;
exports.ERROR = {
    unknown: 'unknown',
    category_id_empty: 'category_id_empty',
    post_key_empty: 'post_key_empty',
    post_key_exists_on_create: 'post_key_exists_on_create',
    malformed_key: 'malformed_key',
    no_categories: 'no_categories',
    category_exists: 'category_exists',
    category_not_exist: 'category_not_exist',
    function_is_not_provided: 'function_is_not_provided',
    unknown_function: 'unknwon_function',
    post_data_is_empty: 'post_data_is_empty',
    requeset_is_empty: 'requeset_is_empty',
    requeset_data_is_empty: 'requeset_data_is_empty',
    uid_is_empty: 'uid_is_empty',
    post_not_found_by_that_key: 'post_not_found_by_that_key',
    permission_denied: 'permission_denied'
};
//# sourceMappingURL=error.js.map