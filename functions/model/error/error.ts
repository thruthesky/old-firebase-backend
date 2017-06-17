

export function isError( code: string ) {
    if ( code === void 0 ) return false;
    if ( typeof code != 'string' ) return false;
    if ( ! code ) return false;
    if ( ERROR['code'] === void 0 ) return false;
    return true;
}


export const ERROR = {
    unknown: 'unknown',
    category_id_empty: 'category_id_empty',
    post_key_empty: 'post_key_empty',
    post_key_exists_on_create: 'post_key_exists_on_create',
    malformed_key:'malformed_key',
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
    timeout: 'timeout',
    json_parse: 'json_parse',
    disconnected: 'disconnected',
    response_is_empty: 'response_is_empty',
    permission_denied: 'permission_denied'
};


