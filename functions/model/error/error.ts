

/**
 * 
 * It checks if 'code' is an error ( or error code ). If 'compare_code' is give, it checks if 'code' is an error AND if the error code of 'code' is same as 'compare_code'.
 * 
 * 
 * ( 입력된 code 가 에러 코드인지 아닌지 검사한다. 만약 compare_code 가 입력되면, code 가 에러코 드이고 compare_code 와 같은 에러인지 검사한다. )
 * 
 * 
 * @param code a string of error code.
 * @param compare a string of error code to compare. ( 입력된 code 의 에러 코드가 compare_code 와 동일한지 검사. )
 * 
 * @code
 * 
               if ( isError(e.message, ERROR.user_not_logged_in ) )this.error = "You are not logged in";
               else this.error = e.message;
 * 
 * @endcode
 */
export function isError(code: string, compare_code?: string): boolean {
    if (!code) return false;
    if (ERROR[code] === void 0) return false;
    if (compare_code) return code == compare_code;
    else return true;
}







export const ERROR = {
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
    secret_is_empty: 'secret_is_empty',
    secret_does_not_match: 'secret_does_not_match',
    post_not_found_by_that_key: 'post_not_found_by_that_key',
    timeout: 'timeout',
    json_parse: 'json_parse',
    disconnected: 'disconnected',
    response_is_empty: 'response_is_empty',
    permission_denied: 'permission_denied',
    //user_logged_out: 'user_logged_out',
    user_not_logged_in: 'user_not_logged_in',
    auth_weak_password: 'auth/weak-password',
    auth_email_already_in_use: 'auth/email-already-in-use',
    auth_invalid_email: 'auth/invalid-email',
    auth_operation_not_allowed: 'auth/operation-not-allowed',
    firebase_auth_unknown_error: 'firebase_auth_unknown_error'
};


