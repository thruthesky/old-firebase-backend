

export function isError( code: string ) {
    if ( code === void 0 ) return false;
    if ( typeof code != 'string' ) return false;
    if ( ! code ) return false;
    if ( ERROR['code'] === void 0 ) return false;
    return true;
}


export const ERROR = {
    category_id_empty: 'category_id_empty',
    post_key_empty: 'post_key_empty',
    malformed_key:'malformed_key',
    no_categories: 'no_categories',
    category_exists: 'category_exists',
    category_not_exist: 'category_not_exist'
};


